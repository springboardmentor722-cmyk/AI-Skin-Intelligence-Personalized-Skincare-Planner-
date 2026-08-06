from app.ai.preprocess import preprocess_image

inputs = preprocess_image("sample.png")

print(inputs.keys())