import os
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

ATLAS_FALLBACK_URI = "mongodb+srv://za5528788_db_user:<REDACTED_PASSWORD>@cluster0.x8nbee8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
MONGODB_URI = os.getenv("MONGODB_URI") or ATLAS_FALLBACK_URI
client = None
db = None

# ─── In-Memory Mock Database ──────────────────────────────────────────────────

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []

    async def find_one(self, query):
        for item in self.data:
            if all(item.get(k) == v for k, v in query.items()):
                return item
        return None

    async def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = ObjectId()
        self.data.append(document)
        class _Result:
            def __init__(self, id): self.inserted_id = id
        return _Result(document["_id"])

    async def insert_many(self, documents):
        ids = []
        for doc in documents:
            doc_copy = dict(doc)
            if "_id" not in doc_copy:
                doc_copy["_id"] = ObjectId()
            self.data.append(doc_copy)
            ids.append(doc_copy["_id"])
        class _ManyResult:
            def __init__(self, ids): self.inserted_ids = ids
        return _ManyResult(ids)

    async def count_documents(self, query=None):
        if not query:
            return len(self.data)
        matches = [i for i in self.data if all(i.get(k) == v for k, v in query.items())]
        return len(matches)

    async def update_one(self, query, update):
        item = await self.find_one(query)
        if item and "$set" in update:
            item.update(update["$set"])
        class _Result:
            matched_count = 1 if item else 0
        return _Result()

    async def delete_one(self, query):
        item = await self.find_one(query)
        if item:
            self.data.remove(item)
        class _Result:
            deleted_count = 1 if item else 0
        return _Result()

    async def delete_many(self, query):
        before = len(self.data)
        self.data = [i for i in self.data if not all(i.get(k) == v for k, v in query.items())]
        class _Result:
            def __init__(self, n): self.deleted_count = n
        return _Result(before - len(self.data))

    def find(self, query):
        results = [i for i in self.data if all(i.get(k) == v for k, v in query.items())]
        class _Cursor:
            def __init__(self, data): self._data = data
            def sort(self, *args, **kwargs): return self
            async def to_list(self, length=None): return self._data[:length] if length else self._data
        return _Cursor(results)

class MockDatabase:
    def __init__(self):
        self._cols = {}
        # Pre-populate doctors collection from bundled JSON so referral network is never empty
        doc_col = MockCollection("doctors")
        json_path = os.path.join(os.path.dirname(__file__), "doctors_data.json")
        if os.path.exists(json_path):
            try:
                import json
                with open(json_path, "r", encoding="utf-8") as f:
                    docs = json.load(f)
                    for d in docs:
                        d_copy = dict(d)
                        if "_id" not in d_copy:
                            d_copy["_id"] = ObjectId()
                        doc_col.data.append(d_copy)
            except Exception:
                pass
        self._cols["doctors"] = doc_col

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._cols:
            self._cols[name] = MockCollection(name)
        return self._cols[name]
    def __getitem__(self, name):
        return getattr(self, name)

# ─── Connection ───────────────────────────────────────────────────────────────

async def _try_ping(motor_client, timeout=5.0):
    """Returns True if ping succeeds within timeout seconds."""
    try:
        await asyncio.wait_for(motor_client.admin.command("ping"), timeout=timeout)
        return True
    except Exception:
        return False

async def connect_to_mongo():
    global client, db
    print("Connecting to MongoDB Atlas...", flush=True)
    try:
        motor_client = AsyncIOMotorClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=4000,
            connectTimeoutMS=4000,
            socketTimeoutMS=4000,
        )
        ok = await _try_ping(motor_client, timeout=5.0)
        if ok:
            client = motor_client
            db = client.get_database("neuromed_db")
            print("[OK] Connected to MongoDB Atlas!", flush=True)
        else:
            motor_client.close()
            raise RuntimeError("Ping timed out")
    except Exception as e:
        print(f"[MOCK] MongoDB unavailable ({type(e).__name__}). Running in in-memory mode.", flush=True)
        db = MockDatabase()

async def close_mongo_connection():
    global client
    if client:
        client.close()
        client = None

def get_database():
    return db
