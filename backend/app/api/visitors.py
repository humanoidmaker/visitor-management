from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_db
from app.utils.auth import get_current_user
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/visitors", tags=["visitors"])

def serialize(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("/")
async def list_visitors(q: str = Query("", description="Search query"), db=Depends(get_db), user=Depends(get_current_user)):
    query = {}
    if q:
        query = {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
        ]}
    docs = await db.visitors.find(query).sort("created_at", -1).to_list(500)
    visitors = [serialize(d) for d in docs]
    return {"success": True, "visitors": visitors}

@router.post("/")
async def create_visitor(data: dict, db=Depends(get_db), user=Depends(get_current_user)):
    required = ["name", "phone"]
    for f in required:
        if not data.get(f):
            raise HTTPException(400, f"Field '{f}' is required")
    valid_id_types = ["aadhaar", "pan", "driving_license", "passport"]
    if data.get("id_type") and data["id_type"] not in valid_id_types:
        raise HTTPException(400, f"id_type must be one of: {valid_id_types}")
    existing = await db.visitors.find_one({"phone": data["phone"]})
    if existing:
        raise HTTPException(400, "Visitor with this phone already exists")
    doc = {
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
    result = await db.visitors.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"success": True, "visitor": doc}

@router.get("/search")
async def search_visitors(q: str = Query(..., description="Search query"), db=Depends(get_db), user=Depends(get_current_user)):
    query = {"$or": [
        {"name": {"$regex": q, "$options": "i"}},
        {"phone": {"$regex": q, "$options": "i"}},
    ]}
    docs = await db.visitors.find(query).to_list(20)
    return {"success": True, "visitors": [serialize(d) for d in docs]}

@router.get("/{visitor_id}")
async def get_visitor(visitor_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    doc = await db.visitors.find_one({"_id": ObjectId(visitor_id)})
    if not doc:
        raise HTTPException(404, "Visitor not found")
    visitor = serialize(doc)
    visits = await db.visits.find({"visitor_id": visitor_id}).sort("check_in", -1).to_list(100)
    for v in visits:
        v["id"] = str(v.pop("_id"))
        if v.get("host_id"):
            host = await db.hosts.find_one({"_id": ObjectId(v["host_id"])})
            v["host_name"] = host["name"] if host else "Unknown"
    visitor["visits"] = visits
    return {"success": True, "visitor": visitor}

@router.put("/{visitor_id}")
async def update_visitor(visitor_id: str, data: dict, db=Depends(get_db), user=Depends(get_current_user)):
    update = {k: v for k, v in data.items() if k in ["name", "phone", "email", "company", "id_type", "id_number", "photo"]}
    update["updated_at"] = datetime.now(timezone.utc)
    result = await db.visitors.update_one({"_id": ObjectId(visitor_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Visitor not found")
    return {"success": True}
