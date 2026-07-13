from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from potholes import potholes

app = FastAPI()

origins = [
    "https://zips-attic-possible.ngrok-free.dev",
    "http://localhost",
    "http://localhost:5173",
]

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/potholes")
async def get_potholes():
    return potholes

@app.get("/api/potholes/{pothole_id}")
async def get_pothole(pothole_id: str):
    for pothole in potholes:
        if pothole["id"] == pothole_id:
            return pothole
    raise HTTPException(status_code=404, detail="Pothole not found")