from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from app.utils.auth import get_current_user
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/blacklist", tags=["blacklist"])

def serialize(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("/")
async def list_blacklist(db=Depends(get_db), user=Depends(get_current_user)):
    docs = await db.blacklist.find().sort("created_at", -1).to_list(500)
    return {"success": True, "blacklist": [serialize(d) for d in docs]}

@router.post("/")
async def add_to_blacklist(data: dict, db=Depends(get_db), user=Depends(get_current_user)):
    if not data.get("phone"):
        raise HTTPException(400, "Phone is required")
    existing = await db.blacklist.find_one({"phone": data["phone"]})
    if existing:
        raise HTTPException(400, "Phone already blacklisted")
    doc = {
        "phone": data["phone"],
        "name": data.get("name", ""),
        "reason": data.get("reason", ""),
        "added_by": user.get("name", user.get("email", "")),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.blacklist.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"success": True, "entry": doc}

@router.delete("/{entry_id}")
async def remove_from_blacklist(entry_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    result = await db.blacklist.delete_one({"_id": ObjectId(entry_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Entry not found")
    return {"success": True}
