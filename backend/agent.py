import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

def _call_openrouter(messages, model="qwen/qwen3.8-27b", temperature=0.0, max_tokens=1024):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set. Add it to backend/.env")
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Neuromed_FYP"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    # Needs requests imported (which is imported on line 29)
    response = __import__('requests').post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()
    
    if "error" in data:
        raise ValueError(f"OpenRouter Error: {data['error']}")
        
    content = data["choices"][0]["message"].get("content")
    if content is None:
        # Fallback in case of refusal or missing content
        content = ""
    return content


import base64
import requests

def validate_mri(image_path: str) -> tuple[bool, str]:
    """
    Agentic GenAI step: Check if the uploaded image is actually a brain MRI before processing.
    Returns (True, "") if valid, (False, "reason") if invalid or error.
    """
    try:
        # Check if GROQ_API_KEY is available implicitly via _get_client later

        ext = image_path.lower().rsplit('.', 1)[-1]
        mime_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}
        mime_type = mime_map.get(ext, 'image/jpeg')

        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        prompt = (
            "You are a strict medical image classifier. "
            "Examine the image carefully. "
            "A Brain MRI scan is a grayscale medical image showing cross-sections of the human brain — it has NO faces, NO people, NO text, NO outdoor scenes, and NO natural photographs. "
            "Is this image a Brain MRI scan suitable for tumor analysis? "
            "Reply with ONLY the single word YES or NO. Nothing else."
        )
        
        answer_raw = _call_openrouter(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{encoded_string}",
                            }
                        }
                    ]
                }
            ],
            model="openai/gpt-4o-mini",
            temperature=0.0,
            max_tokens=5
        )
        
        answer = answer_raw.strip().upper()
        print(f"[validate_mri] OpenRouter vision answer: '{answer}'")
        
        if answer.startswith("YES"):
            return True, ""
        return False, "Image does not appear to be a Brain MRI scan."
    except Exception as e:
        print(f"[validate_mri] Validation error (blocking for safety): {e}")
        # Fail closed: if we cannot validate, reject the image
        return False, f"Validation system error: {str(e)}"

def generate_explanation(analysis_data: Dict[str, Any]) -> str:
    """
    Agentic GenAI call: converts raw model output into a human-readable explanation using Groq API (Llama 3).
    """
    predicted_class = analysis_data.get("predicted_class", "Unknown")
    confidence      = analysis_data.get("confidence", 0)
    probs           = analysis_data.get("probabilities", {})

    prompt = f"""You are an AI assistant inside BrainXAI, a brain MRI analysis application.
An MRI scan has just been processed by a deep learning model (EfficientNetV2-S).

Analysis results:
- Predicted class: {predicted_class}
- Model confidence: {confidence * 100:.1f}%
- Class probabilities: {probs}

A Grad-CAM heatmap was also generated to show which regions of the MRI most influenced the prediction.

Write a clear, friendly explanation (2-3 paragraphs) for the user that covers:
1. What the AI detected and what the predicted class means
2. What the confidence score and probabilities indicate
3. What the Grad-CAM heatmap represents and why it matters

Rules:
- Do NOT fabricate clinical findings not present in the data.
- Clearly state this is an AI-assisted preliminary diagnosis, and it requires official verification.
- Use simple, accessible language — avoid heavy medical jargon.
- Keep it concise and reassuring. Do not output anything other than the explanation."""

    try:
        messages = [
            {"role": "system", "content": "You are a helpful, professional medical AI assistant."},
            {"role": "user", "content": prompt}
        ]
        content = _call_openrouter(
            messages=messages,
            model="openai/gpt-4o-mini",
            temperature=0.3,
            max_tokens=1024
        )
        return content.strip()
    except Exception as e:
        print(f"OpenRouter API Error in generate_explanation: {e}")
        return f"OpenRouter Error: {str(e)}"


def chat_with_assistant(context_data: Dict[str, Any], user_message: str) -> str:
    """
    Context-aware AI assistant for follow-up questions about a specific analysis, using Groq.
    """
    prediction  = context_data.get("prediction", "Unknown")
    confidence  = context_data.get("confidence", 0)
    explanation = context_data.get("explanation", "")

    prompt = f"""You are the BrainXAI AI Assistant.

Current analysis context:
- Prediction: {prediction}
- Confidence: {confidence * 100:.1f}%
- AI explanation already shown to user: {explanation}

User's question: {user_message}

Answer the question helpfully, based strictly on the provided analysis context.
If the question is unrelated to the MRI analysis, politely redirect the conversation back to the results.
Always remind the user you are an AI assistant and this is a preliminary diagnosis that requires official verification."""

    try:
        messages = [
            {"role": "system", "content": "You are a polite, professional, and knowledgeable medical AI assistant."},
            {"role": "user", "content": prompt}
        ]
        content = _call_openrouter(
            messages=messages,
            model="openai/gpt-4o-mini",
            temperature=0.5,
            max_tokens=1024
        )
        return content.strip()
    except Exception as e:
        print(f"OpenRouter API Error in chat_with_assistant: {e}")
        return f"OpenRouter Error: {str(e)}"
