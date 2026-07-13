from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from potholes import potholes

app = FastAPI()

# A more robust list of allowed origins
origins = [
    "https://zips-attic-possible.ngrok-free.dev", # Your specific frontend ngrok URL
    "http://localhost",
    "http://localhost:5173",
]

# Regex to allow any subdomain from ngrok-free.dev
allow_origin_regex = r"https://.*\.ngrok-free\.dev"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex, # Added regex for more flexibility
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
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