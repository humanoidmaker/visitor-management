from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.core.database import get_db
from app.utils.auth import get_current_user
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import csv, io

router = APIRouter(prefix="/api/visits", tags=["visits"])

def serialize(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

async def generate_pass_number(db):
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"VP-{today}-"
    last = await db.visits.find({"pass_number": {"$regex": f"^{prefix}"}}).sort("pass_number", -1).limit(1).to_list(1)
    if last:
        seq = int(last[0]["pass_number"].split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"

@router.post("/checkin")
async def checkin(data: dict, db=Depends(get_db), user=Depends(get_current_user)):
    visitor_id = data.get("visitor_id")
    if not visitor_id:
        required = ["name", "phone"]
        for f in required:
            if not data.get(f):
                raise HTTPException(400, f"Field '{f}' is required for new visitor")
        existing = await db.visitors.find_one({"phone": data["phone"]})
        if existing:
            visitor_id = str(existing["_id"])
            update_fields = {}
            for f in ["name", "email", "company", "id_type", "id_number", "photo"]:
                if data.get(f):
                    update_fields[f] = data[f]
            if update_fields:
                await db.visitors.update_one({"_id": existing["_id"]}, {"$set": update_fields})
        else:
            visitor_doc = {
                "name": data["name"],
                "phone": data["phone"],
                "email": data.get("email", ""),
                "company": data.get("company", ""),
                "id_type": data.get("id_type", ""),
                "id_number": data.get("id_number", ""),
                "photo": data.get("photo", ""),
                "visit_count": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            r = await db.visitors.insert_one(visitor_doc)
            visitor_id = str(r.inserted_id)
    blacklisted = await db.blacklist.find_one({"phone": (await db.visitors.find_one({"_id": ObjectId(visitor_id)}))["phone"]})
    if blacklisted:
        raise HTTPException(403, f"Visitor is blacklisted. Reason: {blacklisted.get('reason', 'N/A')}")
    if not data.get("host_id"):
        raise HTTPException(400, "host_id is required")
    host = await db.hosts.find_one({"_id": ObjectId(data["host_id"])})
    if not host:
        raise HTTPException(404, "Host not found")
    settings_doc = await db.settings.find_one({"key": "pass_validity_hours"})
    validity_hours = settings_doc["value"] if settings_doc else 8
    now = datetime.now(timezone.utc)
    pass_number = await generate_pass_number(db)
    visit = {
        "visitor_id": visitor_id,
        "host_id": data["host_id"],
        "purpose": data.get("purpose", "Meeting"),
        "expected_duration": data.get("expected_duration", ""),
        "vehicle_number": data.get("vehicle_number", ""),
        "items_carried": data.get("items_carried", ""),
        "photo": data.get("visit_photo", ""),
        "pass_number": pass_number,
        "check_in": now,
        "check_out": None,
        "valid_until": now + timedelta(hours=validity_hours),
        "status": "active",
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now,
    }
    result = await db.visits.insert_one(visit)
    await db.visitors.update_one({"_id": ObjectId(visitor_id)}, {"$inc": {"visit_count": 1}, "$set": {"last_visit": now}})
    visit["id"] = str(result.inserted_id)
    visit.pop("_id", None)
    visitor = await db.visitors.find_one({"_id": ObjectId(visitor_id)})
    visit["visitor_name"] = visitor["name"] if visitor else ""
    visit["visitor_phone"] = visitor["phone"] if visitor else ""
    visit["visitor_company"] = visitor.get("company", "") if visitor else ""
    visit["visitor_photo"] = visitor.get("photo", "") if visitor else ""
    visit["host_name"] = host["name"]
    visit["host_department"] = host.get("department", "")
    return {"success": True, "visit": visit}

@router.post("/checkout/{visit_id}")
async def checkout(visit_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    visit = await db.visits.find_one({"_id": ObjectId(visit_id)})
    if not visit:
        raise HTTPException(404, "Visit not found")
    if visit.get("check_out"):
        raise HTTPException(400, "Already checked out")
    now = datetime.now(timezone.utc)
    await db.visits.update_one({"_id": ObjectId(visit_id)}, {"$set": {"check_out": now, "status": "completed"}})
    return {"success": True, "check_out": now.isoformat()}

@router.get("/active")
async def active_visits(db=Depends(get_db), user=Depends(get_current_user)):
    docs = await db.visits.find({"check_out": None, "status": "active"}).sort("check_in", -1).to_list(500)
    visits = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        visitor = await db.visitors.find_one({"_id": ObjectId(d["visitor_id"])})
        d["visitor_name"] = visitor["name"] if visitor else "Unknown"
        d["visitor_phone"] = visitor["phone"] if visitor else ""
        d["visitor_company"] = visitor.get("company", "") if visitor else ""
        d["visitor_photo"] = visitor.get("photo", "") if visitor else ""
        if d.get("host_id"):
            host = await db.hosts.find_one({"_id": ObjectId(d["host_id"])})
            d["host_name"] = host["name"] if host else "Unknown"
            d["host_department"] = host.get("department", "") if host else ""
        visits.append(d)
    return {"success": True, "visits": visits}

@router.get("/today")
async def today_visits(db=Depends(get_db), user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    docs = await db.visits.find({"date": today}).sort("check_in", -1).to_list(500)
    visits = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        visitor = await db.visitors.find_one({"_id": ObjectId(d["visitor_id"])})
        d["visitor_name"] = visitor["name"] if visitor else "Unknown"
        d["visitor_phone"] = visitor["phone"] if visitor else ""
        if d.get("host_id"):
            host = await db.hosts.find_one({"_id": ObjectId(d["host_id"])})
            d["host_name"] = host["name"] if host else "Unknown"
        visits.append(d)
    return {"success": True, "visits": visits}

@router.get("/by-date")
async def visits_by_date(date: str = Query(...), db=Depends(get_db), user=Depends(get_current_user)):
    docs = await db.visits.find({"date": date}).sort("check_in", -1).to_list(500)
    visits = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        visitor = await db.visitors.find_one({"_id": ObjectId(d["visitor_id"])})
        d["visitor_name"] = visitor["name"] if visitor else "Unknown"
        d["visitor_phone"] = visitor["phone"] if visitor else ""
        if d.get("host_id"):
            host = await db.hosts.find_one({"_id": ObjectId(d["host_id"])})
            d["host_name"] = host["name"] if host else "Unknown"
        visits.append(d)
    return {"success": True, "visits": visits}

@router.get("/stats")
async def visit_stats(db=Depends(get_db), user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_checkins = await db.visits.count_documents({"date": today})
    active_visitors = await db.visits.count_documents({"check_out": None, "status": "active"})
    total_visitors = await db.visitors.count_documents({})
    blacklisted = await db.blacklist.count_documents({})
    total_visits = await db.visits.count_documents({})
    last_7_days = []
    for i in range(6, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        count = await db.visits.count_documents({"date": d})
        last_7_days.append({"date": d, "count": count})
    purpose_pipeline = [
        {"$match": {"date": today}},
        {"$group": {"_id": "$purpose", "count": {"$sum": 1}}},
    ]
    purpose_stats = await db.visits.aggregate(purpose_pipeline).to_list(20)
    dept_pipeline = [
        {"$match": {"date": today}},
        {"$lookup": {"from": "hosts", "let": {"hid": {"$toObjectId": "$host_id"}}, "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$hid"]}}}], "as": "host"}},
        {"$unwind": {"path": "$host", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$host.department", "count": {"$sum": 1}}},
    ]
    dept_stats = await db.visits.aggregate(dept_pipeline).to_list(20)
    hour_pipeline = [
        {"$match": {"date": today}},
        {"$project": {"hour": {"$hour": "$check_in"}}},
        {"$group": {"_id": "$hour", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    hour_stats = await db.visits.aggregate(hour_pipeline).to_list(24)
    frequent_pipeline = [
        {"$group": {"_id": "$visitor_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    frequent = await db.visits.aggregate(frequent_pipeline).to_list(10)
    for f in frequent:
        v = await db.visitors.find_one({"_id": ObjectId(f["_id"])})
        f["visitor_name"] = v["name"] if v else "Unknown"
        f["visitor_company"] = v.get("company", "") if v else ""
    return {
        "success": True,
        "stats": {
            "today_checkins": today_checkins,
            "active_visitors": active_visitors,
            "total_visitors": total_visitors,
            "blacklisted": blacklisted,
            "total_visits": total_visits,
            "last_7_days": last_7_days,
            "purpose_stats": [{"purpose": p["_id"] or "Other", "count": p["count"]} for p in purpose_stats],
            "department_stats": [{"department": d["_id"] or "Unknown", "count": d["count"]} for d in dept_stats],
            "hour_stats": [{"hour": h["_id"], "count": h["count"]} for h in hour_stats],
            "frequent_visitors": [{"visitor_id": f["_id"], "name": f["visitor_name"], "company": f["visitor_company"], "count": f["count"]} for f in frequent],
        },
    }

@router.get("/export-csv")
async def export_csv(from_date: str = Query(..., alias="from"), to_date: str = Query(..., alias="to"), db=Depends(get_db), user=Depends(get_current_user)):
    docs = await db.visits.find({"date": {"$gte": from_date, "$lte": to_date}}).sort("check_in", 1).to_list(5000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Pass Number", "Visitor Name", "Phone", "Company", "Host", "Purpose", "Check In", "Check Out", "Duration", "Vehicle", "Items Carried"])
    for d in docs:
        visitor = await db.visitors.find_one({"_id": ObjectId(d["visitor_id"])})
        host = await db.hosts.find_one({"_id": ObjectId(d["host_id"])}) if d.get("host_id") else None
        check_in = d.get("check_in")
        check_out = d.get("check_out")
        duration = ""
        if check_in and check_out:
            diff = check_out - check_in
            hours, remainder = divmod(int(diff.total_seconds()), 3600)
            minutes = remainder // 60
            duration = f"{hours}h {minutes}m"
        writer.writerow([
            d.get("pass_number", ""),
            visitor["name"] if visitor else "",
            visitor["phone"] if visitor else "",
            visitor.get("company", "") if visitor else "",
            host["name"] if host else "",
            d.get("purpose", ""),
            check_in.isoformat() if check_in else "",
            check_out.isoformat() if check_out else "",
            duration,
            d.get("vehicle_number", ""),
            d.get("items_carried", ""),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=visits_{from_date}_to_{to_date}.csv"},
    )
