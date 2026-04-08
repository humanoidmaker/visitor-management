from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_db
from app.utils.auth import get_current_user
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/hosts", tags=["hosts"])

def serialize(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("/")
async def list_hosts(department: str = Query("", description="Filter by department"), db=Depends(get_db), user=Depends(get_current_user)):
    query = {}
    if department:
        query["department"] = department
    docs = await db.hosts.find(query).sort("name", 1).to_list(500)
    return {"success": True, "hosts": [serialize(d) for d in docs]}

@router.post("/")
async def create_host(data: dict, db=Depends(get_db), user=Depends(get_current_user)):
    required = ["name", "employee_id", "department"]
    for f in required:
        if not data.get(f):
            raise HTTPException(400, f"Field '{f}' is required")
    existing = await db.hosts.find_one({"employee_id": data["employee_id"]})
    if existing:
        raise HTTPException(400, "Employee ID already exists")
    doc = {
        "name": data["name"],
        "employee_id": data["employee_id"],
        "department": data["department"],
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "designation": data.get("designation", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.hosts.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"success": True, "host": doc}

@router.get("/departments")
async def list_departments(db=Depends(get_db), user=Depends(get_current_user)):
    departments = await db.hosts.distinct("department")
    return {"success": True, "departments": departments}

@router.get("/{host_id}")
async def get_host(host_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    doc = await db.hosts.find_one({"_id": ObjectId(host_id)})
    if not doc:
        raise HTTPException(404, "Host not found")
    return {"success": True, "host": serialize(doc)}

@router.put("/{host_id}")
async def update_host(host_id: str, data: dict, db=Depends(get_db), user=Depends(get_current_user)):
    update = {k: v for k, v in data.items() if k in ["name", "employee_id", "department", "phone", "email", "designation", "is_active"]}
    update["updated_at"] = datetime.now(timezone.utc)
    result = await db.hosts.update_one({"_id": ObjectId(host_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Host not found")
    return {"success": True}

@router.delete("/{host_id}")
async def delete_host(host_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    result = await db.hosts.delete_one({"_id": ObjectId(host_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Host not found")
    return {"success": True}
