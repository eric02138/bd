"""
Very simple api
"""

import os
import csv
import io
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

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
        await db_client.admin.command("ping")
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

# Allow CORS requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


async def get_database():
    return database


class BDUser(BaseModel):
    username: str
    password: str
    robots: Optional[List[str]] = []


class RobotEvent(BaseModel):
    robot: Optional[str] = None
    status: Optional[str] = (
        None  # could be an enum, and could even be its own collection
    )
    description: Optional[str] = None
    createdAt: Optional[datetime] = None


# Empty for now... the root route could point to the docs, and maybe the version route
# could point to a change doc.
@app.get("/")
async def get_root():
    return {"API_Name": "RobotAPI"}


@app.get("/v1")
async def get_version():
    return {"Version": "1.0"}


# Note: This isn't how to do auth.  We'd use OAuth or something like that.
# This endpoint is more geared to see which user owns which robots, for filtering in the future.
@app.post("/v1/bduser")
async def post_bduser(data: BDUser):
    db = await get_database()
    if not data.username:
        all_users = []

        async for bduser in db.bduser.find():
            all_users.append(
                {
                    "username": bduser["username"],
                    "password": bduser["password"],
                    "robots": bduser["robots"],
                }
            )
        return all_users
    single_user = await db.bduser.find_one({"username": data.username}, {"_id": 0})
    return single_user


# FastAPI's route matching is dumb.
@app.get("/v1/robot_event_by_username/{username}")
async def get_robot_event_by_username(username: str):
    db = await get_database()
    bduser_data = await db.bduser.find_one({"username": username})
    bduser_robots = bduser_data["robots"]
    robot_events = []
    async for robot_event in db.robot_event.find({"robot": {"$in": bduser_robots}}):
        robot_events.append(
            {
                "_id": str(robot_event["_id"]),
                "robot": robot_event["robot"],
                "status": robot_event["status"],
                "description": robot_event["description"],
                "createdAt": robot_event["createdAt"],
            }
        )
    return robot_events


# A bit redundant, but could be useful for sharing what's going on with a single robot
@app.get("/v1/robot_event/{robot}")
async def get_robot_event_by_robot(robot: str):
    db = await get_database()
    robot_events = []
    async for robot_event in db.robot_event.find({"robot": robot}):
        robot_events.append(
            {
                "_id": str(robot_event["_id"]),
                "robot": robot_event["robot"],
                "status": robot_event["status"],
                "description": robot_event["description"],
                "createdAt": robot_event["createdAt"],
            }
        )
    return robot_events


# This endpoint allows optional parameters for filtering, which get passed along to the DB
@app.get("/v1/robot_event")
async def get_robot_event(
    robot: Optional[str] = None,
    status: Optional[str] = None,
    description: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
):
    filters = {}
    if robot:
        filters.update({"robot": robot})
    if status:
        filters.update({"status": status})
    if description:
        filters.update({"description": {"$regex": description, "$options": "i"}})
    if dateFrom:
        filters.update({"createdAt": {"$gte": dateFrom}})
    if dateTo:
        filters.update({"createdAt": {"$lt": dateTo}})
    db = await get_database()
    all_robot_events = []
    async for robot_event in db.robot_event.find(filters):
        all_robot_events.append(
            {
                "_id": str(robot_event["_id"]),
                "robot": robot_event["robot"],
                "status": robot_event["status"],
                "description": robot_event["description"],
                "createdAt": robot_event["createdAt"],
            }
        )
    return all_robot_events


@app.get("/v1/export_robot_event_by_username/{username}")
async def get_export_robot_event_by_username(
    username: str,
    status: Optional[str] = None,
    description: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
    format: Optional[str] = "csv",
):

    if format not in ["json", "csv"]:
        raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")

    db = await get_database()
    bduser_data = await db.bduser.find_one({"username": username})

    if not bduser_data:
        return Response(content="User not found", status_code=404)

    bduser_robots = bduser_data["robots"]

    filters = {}
    if status:
        filters.update({"status": status})
    if description:
        filters.update({"description": {"$regex": description, "$options": "i"}})
    if dateFrom:
        try:
            date_from_str = datetime.fromisoformat(dateFrom)
            filters.update({"createdAt": {"$gte": date_from_str}})
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid dateFrom format. Use YYYY-MM-DD"
            )
    if dateTo:
        try:
            date_from_str = datetime.fromisoformat(dateTo)
            # This seems silly.  There's gotta be a better way to
            # avoid overwriting the createdAt filter...
            if not "createdAt" in filters:
                filters.update({"createdAt": {"$gte": date_from_str}})
            else:
                filters["createdAt"]["$lt"] = date_from_str
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid dateTo format. Use YYYY-MM-DD"
            )
    db = await get_database()
    all_robot_events = []
    async for robot_event in db.robot_event.find(filters):
        all_robot_events.append(
            {
                "robot": robot_event["robot"],
                "status": robot_event["status"],
                "description": robot_event["description"],
                "createdAt": robot_event["createdAt"],
            }
        )
    # JSON
    if format == "json":
        return all_robot_events
    # CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Robot", "Status", "Description", "Created At"])
    async for robot_event in db.robot_event.find({"robot": {"$in": bduser_robots}}):
        writer.writerow(
            [
                robot_event["robot"],
                robot_event["status"],
                robot_event["description"],
                robot_event["createdAt"],
            ]
        )
    csv_content = output.getvalue()
    output.close()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=robot_events_{username}.csv"
        },
    )


@app.get("/v1/export_robot_event")
async def get_export_robot_event(
    robot: Optional[str] = None,
    status: Optional[str] = None,
    description: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
    format: Optional[str] = "csv",
):

    if format not in ["json", "csv"]:
        raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")

    filters = {}
    if robot:
        filters.update({"robot": robot})
    if status:
        filters.update({"status": status})
    if description:
        filters.update({"description": {"$regex": description, "$options": "i"}})
    if dateFrom:
        try:
            date_from_str = datetime.fromisoformat(dateFrom)
            filters.update({"createdAt": {"$gte": date_from_str}})
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid dateFrom format. Use YYYY-MM-DD"
            )
    if dateTo:
        try:
            date_from_str = datetime.fromisoformat(dateTo)
            # Again, this seems silly.  There's gotta be a better way
            # to avoid overwriting the createdAt filter...
            if not "createdAt" in filters:
                filters.update({"createdAt": {"$gte": date_from_str}})
            else:
                filters["createdAt"]["$lt"] = date_from_str
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid dateTo format. Use YYYY-MM-DD"
            )
    db = await get_database()
    all_robot_events = []
    async for robot_event in db.robot_event.find(filters):
        all_robot_events.append(
            {
                "robot": robot_event["robot"],
                "status": robot_event["status"],
                "description": robot_event["description"],
                "createdAt": robot_event["createdAt"],
            }
        )
    # JSON
    if format == "json":
        return all_robot_events
    # CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Robot", "Status", "Description", "Created At"])
    for robot_event in all_robot_events:
        writer.writerow(
            [
                robot_event["robot"],
                robot_event["status"],
                robot_event["description"],
                robot_event["createdAt"],
            ]
        )
    csv_content = output.getvalue()
    output.close()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=robot_events.csv"},
    )
