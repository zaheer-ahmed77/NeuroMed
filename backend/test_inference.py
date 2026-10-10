import asyncio
import io
from PIL import Image
import numpy as np
import traceback

import httpx
from asgi_lifespan import LifespanManager

# Import the preprocess and lifespan directly from main
from main import app, preprocess_image, predict
from fastapi import UploadFile

async def run_tests():
    print("Testing PyTorch Swin-T Inference Backend...")
    
    # 1. Create a dummy solid image (should fail validation or give low confidence)
    img = Image.new('RGB', (224, 224), color=(100, 100, 100))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    # 2. Test preprocessing pipeline
    print("Running Preprocessing Test...")
    try:
        import torch
        tensor = preprocess_image(img_bytes)
        assert tensor.shape == (1, 3, 224, 224), f"Wrong shape: {tensor.shape}"
        assert tensor.dtype == torch.float32, f"Wrong dtype: {tensor.dtype}"
        print("[OK] Preprocessing produced correct shape and type.")
    except Exception as e:
        print(f"[FAIL] Preprocessing failed: {e}")
        traceback.print_exc()

    # 3. Use httpx to test the FastAPI app context
    print("\nRunning API integration test...")
    try:
        async with LifespanManager(app):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
                response = await client.post("/predict", files=files)
                
                print(f"API Response Status: {response.status_code}")
                # We expect 422 because the image is a solid gray block, failing validation
                if response.status_code == 422:
                    print("[OK] Solid image was correctly rejected by validity checks.")
                else:
                    print(f"Unexpected response: {response.json()}")
    except Exception as e:
        print(f"[FAIL] API Test failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    asyncio.run(run_tests())
