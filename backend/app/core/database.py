from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = None
db = None

async def get_db():
    return db

async def init_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_name = settings.MONGODB_URI.rsplit("/", 1)[-1].split("?")[0] or "visitor_mgmt"
    db = client[db_name]
    await db.users.create_index("email", unique=True)
    await db.visitors.create_index("phone")
    await db.visits.create_index([("visitor_id", 1), ("date", -1)])
    await db.hosts.create_index("employee_id", unique=True)
    await db.blacklist.create_index("phone", unique=True)
    if not await db.settings.find_one({"key": "app_name"}):
        await db.settings.insert_many([
            {"key": "app_name", "value": "GatePass"},
            {"key": "org_name", "value": "GatePass Organization"},
            {"key": "org_address", "value": "123 Business Park, Bengaluru, Karnataka 560001"},
            {"key": "pass_validity_hours", "value": 8},
            {"key": "require_photo", "value": True},
        ])
    departments = ["Engineering", "HR", "Finance", "Marketing", "Admin", "Management"]
    for dept in departments:
        await db.departments.update_one({"name": dept}, {"$setOnInsert": {"name": dept}}, upsert=True)
