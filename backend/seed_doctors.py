import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URI = None
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("MONGODB_URI"):
                MONGO_URI = line.split("=", 1)[1].strip()
                break

    if not MONGO_URI:
        print("Error: MONGODB_URI not found in .env file.")
        return

    print("Connecting to MongoDB Atlas to seed doctors...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_database("neuromed_db")
    collection = db["doctors"]

    with open("doctors_data.json", "r") as f:
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
