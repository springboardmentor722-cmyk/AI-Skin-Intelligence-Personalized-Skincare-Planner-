import os
import json

from dotenv import load_dotenv
from PIL import Image
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_skin_with_gemini(image_path):

    image = Image.open(image_path)

    prompt = """
You are an expert dermatologist with 20 years of experience.

Analyze the uploaded facial skin image carefully.

Evaluate:

1. Skin Type
- Oily
- Dry
- Combination
- Normal
- Sensitive

2. Skin Concerns
- Acne
- Pigmentation
- Redness
- Wrinkles
- Dark Circles

Rules:
- Scores must be integers between 0 and 100.
- 0 = No issue.
- 100 = Very severe issue.
- overall_score must represent overall skin health.
  100 = Excellent skin
  0 = Very poor skin

Also provide a concise dermatologist-style summary in 2–3 sentences.

Return ONLY valid JSON.

Example:

{
  "skin_type": "Combination",
  "acne_score": 28,
  "pigmentation_score": 14,
  "redness_score": 8,
  "wrinkles_score": 5,
  "dark_circle_score": 30,
  "overall_score": 82,
  
  "ai_summary": "Combination skin with mild acne and slight pigmentation. Wrinkles are minimal, while dark circles are moderately visible. Overall skin health appears good with minor concerns."
}

Do not include markdown.
Do not include explanations.
Return JSON only.
"""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=[prompt, image],
    )

    text = response.text.strip()

# Remove markdown if Gemini returns ```json ... ```
    text = text.replace("```json", "")
    text = text.replace("```", "")
    text = text.strip()

    try:
     data = json.loads(text)
    except Exception:
     data = {}

# Ensure every field exists
    result = {
    "skin_type": data.get("skin_type", "Unknown"),

    "acne_score": int(data.get("acne_score", 0)),
    "pigmentation_score": int(data.get("pigmentation_score", 0)),
    "redness_score": int(data.get("redness_score", 0)),
    "wrinkles_score": int(data.get("wrinkles_score", 0)),
    "dark_circle_score": int(data.get("dark_circle_score", 0)),

    "overall_score": int(data.get("overall_score", 50)),

    "ai_summary": data.get(
        "ai_summary",
        "Unable to analyze skin clearly. Please upload a clearer image."
    ),
}

    return result