import asyncio, sys, random
from datetime import datetime, timezone, timedelta
sys.path.insert(0, ".")
from app.core.database import init_db, get_db
from app.utils.auth import hash_password

async def seed():
    await init_db()
    db = await get_db()

    if await db.users.find_one({"email": "admin@visitor.local"}):
        print("Admin exists, skipping admin seed")
    else:
        await db.users.insert_one({"email": "admin@visitor.local", "password_hash": hash_password("admin123"), "name": "Admin", "role": "admin", "is_active": True})
        print("Admin created: admin@visitor.local / admin123")

    departments = ["Engineering", "HR", "Finance", "Marketing", "Admin", "Management"]
    for dept in departments:
        await db.departments.update_one({"name": dept}, {"$setOnInsert": {"name": dept}}, upsert=True)

    if await db.hosts.count_documents({}) >= 10:
        print("Hosts already seeded"); return

    hosts_data = [
        {"name": "Rajesh Kumar", "employee_id": "EMP001", "department": "Engineering", "phone": "9876543210", "email": "rajesh@company.com", "designation": "Senior Engineer"},
        {"name": "Priya Sharma", "employee_id": "EMP002", "department": "HR", "phone": "9876543211", "email": "priya@company.com", "designation": "HR Manager"},
        {"name": "Amit Patel", "employee_id": "EMP003", "department": "Finance", "phone": "9876543212", "email": "amit@company.com", "designation": "Finance Lead"},
        {"name": "Sneha Reddy", "employee_id": "EMP004", "department": "Marketing", "phone": "9876543213", "email": "sneha@company.com", "designation": "Marketing Head"},
        {"name": "Vikram Singh", "employee_id": "EMP005", "department": "Engineering", "phone": "9876543214", "email": "vikram@company.com", "designation": "Tech Lead"},
        {"name": "Anita Desai", "employee_id": "EMP006", "department": "Admin", "phone": "9876543215", "email": "anita@company.com", "designation": "Admin Manager"},
        {"name": "Suresh Menon", "employee_id": "EMP007", "department": "Management", "phone": "9876543216", "email": "suresh@company.com", "designation": "Director"},
        {"name": "Kavita Nair", "employee_id": "EMP008", "department": "HR", "phone": "9876543217", "email": "kavita@company.com", "designation": "HR Executive"},
        {"name": "Deepak Joshi", "employee_id": "EMP009", "department": "Engineering", "phone": "9876543218", "email": "deepak@company.com", "designation": "Software Engineer"},
        {"name": "Meera Iyer", "employee_id": "EMP010", "department": "Finance", "phone": "9876543219", "email": "meera@company.com", "designation": "Accountant"},
    ]
    now = datetime.now(timezone.utc)
    for h in hosts_data:
        h["is_active"] = True
        h["created_at"] = now
        h["updated_at"] = now
    await db.hosts.insert_many(hosts_data)
    host_ids = [str(h["_id"]) for h in await db.hosts.find().to_list(100)]
    print(f"Seeded {len(hosts_data)} hosts")

    visitors_data = [
        {"name": "Arjun Mehta", "phone": "8001234501", "email": "arjun@techcorp.com", "company": "TechCorp Solutions", "id_type": "aadhaar", "id_number": "1234-5678-9012"},
        {"name": "Pooja Gupta", "phone": "8001234502", "email": "pooja@infosys.com", "company": "Infosys", "id_type": "pan", "id_number": "ABCPG1234K"},
        {"name": "Rahul Verma", "phone": "8001234503", "email": "rahul@wipro.com", "company": "Wipro Ltd", "id_type": "driving_license", "id_number": "DL1234567890"},
        {"name": "Neha Kapoor", "phone": "8001234504", "email": "neha@tcs.com", "company": "TCS", "id_type": "passport", "id_number": "P1234567"},
        {"name": "Sanjay Mishra", "phone": "8001234505", "email": "sanjay@hcl.com", "company": "HCL Technologies", "id_type": "aadhaar", "id_number": "2345-6789-0123"},
        {"name": "Divya Rao", "phone": "8001234506", "email": "divya@amazon.com", "company": "Amazon India", "id_type": "pan", "id_number": "DEFDR5678L"},
        {"name": "Manish Tiwari", "phone": "8001234507", "email": "manish@flipkart.com", "company": "Flipkart", "id_type": "aadhaar", "id_number": "3456-7890-1234"},
        {"name": "Ritu Saxena", "phone": "8001234508", "email": "ritu@google.com", "company": "Google India", "id_type": "passport", "id_number": "P2345678"},
        {"name": "Karan Malhotra", "phone": "8001234509", "email": "karan@microsoft.com", "company": "Microsoft India", "id_type": "driving_license", "id_number": "DL2345678901"},
        {"name": "Isha Chauhan", "phone": "8001234510", "email": "isha@oracle.com", "company": "Oracle India", "id_type": "pan", "id_number": "GHIIC7890M"},
        {"name": "Vivek Agarwal", "phone": "8001234511", "email": "vivek@deloitte.com", "company": "Deloitte", "id_type": "aadhaar", "id_number": "4567-8901-2345"},
        {"name": "Swati Pandey", "phone": "8001234512", "email": "swati@kpmg.com", "company": "KPMG", "id_type": "pan", "id_number": "JKLSP1234N"},
        {"name": "Rohit Bhatia", "phone": "8001234513", "email": "rohit@ibm.com", "company": "IBM India", "id_type": "driving_license", "id_number": "DL3456789012"},
        {"name": "Ananya Das", "phone": "8001234514", "email": "ananya@accenture.com", "company": "Accenture", "id_type": "aadhaar", "id_number": "5678-9012-3456"},
        {"name": "Gaurav Bhatt", "phone": "8001234515", "email": "gaurav@pwc.com", "company": "PwC India", "id_type": "passport", "id_number": "P3456789"},
        {"name": "Nisha Kulkarni", "phone": "8001234516", "email": "nisha@dell.com", "company": "Dell Technologies", "id_type": "pan", "id_number": "MNOPK5678O"},
        {"name": "Ajay Thakur", "phone": "8001234517", "email": "ajay@samsung.com", "company": "Samsung India", "id_type": "aadhaar", "id_number": "6789-0123-4567"},
        {"name": "Prachi Shah", "phone": "8001234518", "email": "prachi@apple.com", "company": "Apple India", "id_type": "driving_license", "id_number": "DL4567890123"},
        {"name": "Nitin Goyal", "phone": "8001234519", "email": "nitin@cisco.com", "company": "Cisco India", "id_type": "pan", "id_number": "QRSNG9012P"},
        {"name": "Megha Sethi", "phone": "8001234520", "email": "megha@intel.com", "company": "Intel India", "id_type": "passport", "id_number": "P4567890"},
    ]
    for v in visitors_data:
        v["photo"] = ""
        v["visit_count"] = 0
        v["created_at"] = now
        v["updated_at"] = now
    await db.visitors.insert_many(visitors_data)
    visitor_ids = [str(v["_id"]) for v in await db.visitors.find().to_list(100)]
    print(f"Seeded {len(visitors_data)} visitors")

    purposes = ["Meeting", "Interview", "Delivery", "Maintenance", "Personal", "Other"]
    visits_list = []
    for i in range(30):
        if i < 20:
            day_offset = random.randint(1, 7)
        elif i < 25:
            day_offset = 0
        else:
            day_offset = 1
        base_date = now - timedelta(days=day_offset)
        hour = random.randint(8, 17)
        check_in = base_date.replace(hour=hour, minute=random.randint(0, 59), second=0)
        date_str = check_in.strftime("%Y-%m-%d")
        seq = i + 1
        pass_number = f"VP-{check_in.strftime('%Y%m%d')}-{seq:04d}"
        visit = {
            "visitor_id": random.choice(visitor_ids),
            "host_id": random.choice(host_ids),
            "purpose": random.choice(purposes),
            "expected_duration": f"{random.choice([30, 60, 90, 120])} mins",
            "vehicle_number": random.choice(["", "", "KA01AB1234", "MH02CD5678", "DL03EF9012"]),
            "items_carried": random.choice(["", "", "Laptop", "Documents", "Package"]),
            "photo": "",
            "pass_number": pass_number,
            "check_in": check_in,
            "valid_until": check_in + timedelta(hours=8),
            "date": date_str,
            "created_at": check_in,
        }
        if i < 20:
            checkout_time = check_in + timedelta(hours=random.randint(1, 4), minutes=random.randint(0, 59))
            visit["check_out"] = checkout_time
            visit["status"] = "completed"
        elif i < 25:
            visit["check_out"] = None
            visit["status"] = "active"
        else:
            checkout_time = check_in + timedelta(hours=random.randint(1, 6), minutes=random.randint(0, 59))
            visit["check_out"] = checkout_time
            visit["status"] = "completed"
        visits_list.append(visit)
    await db.visits.insert_many(visits_list)
    print(f"Seeded {len(visits_list)} visits")

    blacklist_entries = [
        {"phone": "9999999991", "name": "Suspicious Person A", "reason": "Attempted unauthorized access", "added_by": "Admin", "created_at": now - timedelta(days=30)},
        {"phone": "9999999992", "name": "Banned Visitor B", "reason": "Theft reported", "added_by": "Admin", "created_at": now - timedelta(days=15)},
    ]
    for entry in blacklist_entries:
        await db.blacklist.update_one({"phone": entry["phone"]}, {"$setOnInsert": entry}, upsert=True)
    print("Seeded 2 blacklist entries")
    print("Sample data seeding complete!")

asyncio.run(seed())
