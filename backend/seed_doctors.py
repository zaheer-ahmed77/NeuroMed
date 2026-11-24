import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URI = os.getenv("MONGODB_URI")
    
    # Try local .env files
    if not MONGO_URI:
        env_paths = [".env", os.path.join(os.path.dirname(__file__), ".env"), os.path.join(os.path.dirname(__file__), "..", ".env")]
        for ep in env_paths:
            if os.path.exists(ep):
                try:
                    with open(ep, "r", encoding="utf-8") as f:
                        for line in f:
                            if line.strip().startswith("MONGODB_URI="):
                                MONGO_URI = line.split("=", 1)[1].strip()
                                break
                    if MONGO_URI:
                        break
                except Exception:
                    pass

    if not MONGO_URI:
        print("Error: MONGODB_URI not found in environment or .env file.")
        return

    print("Connecting to MongoDB Atlas to seed doctors...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_database("neuromed_db")
    collection = db["doctors"]

    json_path = os.path.join(os.path.dirname(__file__), "doctors_data.json")
    with open(json_path, "r", encoding="utf-8") as f:
        doctors = json.load(f)

    # Check if we already have doctors
    count = await collection.count_documents({})
    if count > 0:
        print(f"Database already has {count} doctors. Dropping them to re-seed...")
        await collection.delete_many({})

    print(f"Inserting {len(doctors)} doctors...")
    await collection.insert_many(doctors)
    print("Seed complete! You can now close this script.")

if __name__ == "__main__":
    asyncio.run(main())
