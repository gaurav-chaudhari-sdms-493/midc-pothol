import json
import re
import os
from PIL import Image
from google import genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path='/home/stark/WebstormProjects/midc_pothole/backend/.env')

# Get the API key from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# Use the Client class for initialization for broader compatibility
client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3.1-flash-lite" # gemini-pro is a stable model name

DETECT_PROMPT = """You are an expert road-damage inspector analyzing a photo for potholes.

Find every ACTUAL POTHOLE in this image — a genuine pit, cavity, or depression in the road surface with visible depth, broken edges, or exposed sub-surface material.

Be smart and strict:
- Do NOT detect tar patches or repaired road sections (these are flat, filled, uniform-colored — not damage)
- Do NOT detect surface cracks with no depth or depression
- Do NOT detect manholes, drain covers, shadows, wet stains, or oil marks
- Do NOT detect clear, undamaged road

For each REAL pothole found, provide:
- "box_2d": bounding box in normalized coordinates (0-1000 scale) as [y1, x1, y2, x2]
- "confidence": your confidence this is genuinely a pothole, from 0.0 to 1.0
- "size_category": one of "small", "medium", "large" based on visual proportion relative to typical road lane width (~300cm)
- "estimated_width_cm_range": a rough estimated width range as a string, e.g. "15-25cm" — base this on typical pothole proportions relative to the road surface visible in the photo. This is a rough visual estimate, not a precise measurement.

Respond ONLY with valid JSON, no other text, in this exact format:
{
  "potholes": [
    {"box_2d": [y1, x1, y2, x2], "confidence": 0.9, "size_category": "medium", "estimated_width_cm_range": "20-30cm"}
  ]
}

If there are no real potholes, respond: {"potholes": []}
"""

def _image_to_base64_not_needed():
    pass  # kept for compatibility, not used with google-genai SDK

def detect_with_gemini(pil_image: Image.Image):
    try:
        # Correctly call the generate_content method on the `models` attribute
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[DETECT_PROMPT, pil_image]
        )
        raw_content = response.text
        print(f"[DEBUG] Raw Gemini response: {repr(raw_content)}")

        text = (raw_content or "").strip()
        text = re.sub(r"^```json\s*|\s*```$", "", text, flags=re.MULTILINE).strip()

        if not text:
            return [], "Gemini returned empty response"

        data = json.loads(text)
        return data.get("potholes", []), None
    except Exception as e:
        error_message = str(e)
        if hasattr(e, 'message'):
            error_message = e.message
        print(f"[ERROR] Gemini detection failed: {error_message}")
        return [], error_message