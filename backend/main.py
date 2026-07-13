from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from potholes import potholes

app = FastAPI()

# Add CORS middleware back in with the simplest configuration
# This is the most reliable way to handle preflight requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
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