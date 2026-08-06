from app.ai.gemini_skin_analyzer import analyze_skin_with_gemini


def predict_skin(image_path):
    return analyze_skin_with_gemini(image_path)