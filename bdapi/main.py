import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

# Grumble grumble, I thought onevent was fine.  Then they had to make things complicated.
# I get it, but I can still complain...

# MongoDB connection variables
DATABASE_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "bdapi")

# Global variable to store database connection
db_client: Optional[AsyncIOMotorClient] = None
database = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_client, database
    
    print("Connecting to MongoDB...")
    db_client = AsyncIOMotorClient(DATABASE_URL)
    database = db_client[DATABASE_NAME]
    
    # Test the connection
    try:
        await db_client.admin.command('ping')
        print("Successfully connected to MongoDB!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise
    
    yield
    
    # Shutdown
    print("Closing MongoDB connection...")
    if db_client:
        db_client.close()
    print("MongoDB connection closed.")

app = FastAPI(lifespan=lifespan)

async def get_database():
    return database

# These models are unnecessary for now, since we're not actually altering any data.
# But there is THE FUTURE...
class BDUser(BaseModel):
    name: str
    password: str
    robots: Optional[List[str]] = []

class Status(str, Enum):
    active = "active"
    error = "error"
    inactive = "inactive"
    maintenance = "maintenance"

class RobotEvent(BaseModel):
    name: str
    status: Status
    description: Optional[str] = None
    createdAt: datetime

# Empty for now... the root route could point to the docs, and maybe the version route
# could point to a change doc.
@app.get("/")
async def get_root():
    return {"Nothing": "Here"}

@app.get("/v1")
async def get_version():
    return {"Nothing": "Here"}

@app.get("/v1/bduser")
async def get_bduser(name: str = None):
    db = await get_database()
    if not name:
        all_users = []

        async for bduser in db.bduser.find():
            all_users.append({
                "name": bduser["name"],
                "password": bduser["password"],
                "robots": bduser["robots"]
            })
        return all_users
    single_user = await db.bduser.find_one({"name": name}, {'_id': 0})
    return single_user

@app.get("/v1/robot_event")
async def get_robot_event(robot: str = None, 
                          status: str = None, 
                          description: str = None, 
                          startDate: datetime = None, 
                          endDate: datetime = None):
    db = await get_database()

    all_robot_events = []
    if not robot:
        async for robot_event in db.robot_event.find():
            print(robot_event)
            all_robot_events.append({
                "robot": robot_event["robot"],
                "status": robot_event["status"],
                "description": robot_event["description"],
                "createdAt": robot_event["createdAt"]
            })
        return all_robot_events
    search_filter = {}
    if robot:
        search_filter.update({"robot": robot})
    if status:
        search_filter.update({"status": status})
    


@app.get("/v1/robot_event/{robot}")
async def get_robot_event_by_robot(robot: str, q: str = None):
    return {"robot": robot, "q": q}


@app.get("/v1/{item_id}")
async def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}