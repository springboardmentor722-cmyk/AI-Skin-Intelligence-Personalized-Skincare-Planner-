# backend/ai_model.py

"""
AI Model for Skin Concern Detection
Loads the trained model and runs inference on uploaded images
"""

import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import os
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "model_checkpoint.pth")

# Skin concern classes (in the same order as training)
CLASS_NAMES = [
    'Redness',
    'dark spots',
    'inflammatory acne',
    'non inflammatory acne black heads',
    'non inflammatory acne white heads',
    'pigmentation',
    'pores',
    'wrinkles'
]

# Image transformations (must match training)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def load_model():
    """
    Load the trained model from file
    """
    try:
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model file not found: {MODEL_PATH}")
            return None
        
        # Load the model architecture
        model = models.efficientnet_b0(weights=None)
        num_classes = len(CLASS_NAMES)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
        
        # Load the trained weights
        checkpoint = torch.load(MODEL_PATH, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        
        model.to(device)
        model.eval()
        
        logger.info(f"✅ Model loaded successfully on {device}")
        return model
        
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        return None


# Load model once when module is imported
model = load_model()


def predict_skin_concern(image_path):
    """
    Predict skin concern from an image file
    
    Args:
        image_path: Path to the image file
        
    Returns:
        dict: {
            'predicted_class': str,
            'confidence': float,
            'all_predictions': list of {class: confidence}
        }
    """
    if model is None:
        return {'error': 'Model not loaded'}
    
    try:
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        # Run inference
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            
        # Get top prediction
        top_prob, top_idx = torch.max(probabilities, 1)
        predicted_class = CLASS_NAMES[top_idx.item()]
        confidence = top_prob.item() * 100
        
        # Get all predictions
        all_predictions = []
        for i, class_name in enumerate(CLASS_NAMES):
            all_predictions.append({
                'class': class_name,
                'confidence': probabilities[0][i].item() * 100
            })
        
        # Sort by confidence descending
        all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'success': True,
            'predicted_class': predicted_class,
            'confidence': round(confidence, 2),
            'all_predictions': all_predictions[:5]  # Top 5 predictions
        }
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}")
        return {'error': str(e)}