"""
Groq AI client with up-to-date models (Nov 2025+).
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

GROQ_API_KEY = os.getenv('GROQ_API_KEY')

if not GROQ_API_KEY:
    print("[WARN] GROQ_API_KEY not set — Groq fallback disabled")
    _client = None
else:
    _client = Groq(api_key=GROQ_API_KEY)


# Current Groq models (Nov 2025+)
# Each model has SEPARATE quota - good for fallback
GROQ_MODELS = [
    "llama-3.1-8b-instant",          # Small, fast, generous quota
    "gemma2-9b-it",                  # Different family - separate quota bucket
    "llama-3.3-70b-versatile",       # Big, best quality (uses more tokens)
]


def is_groq_available() -> bool:
    return _client is not None


def generate_response_groq(prompt: str, system_instruction: str = None) -> str:
    """Generate response using Groq with model fallback."""
    if not _client:
        raise Exception("Groq client not initialized (missing GROQ_API_KEY)")
    
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})
    
    last_error = None
    
    for model_name in GROQ_MODELS:
        try:
            print(f"[Groq] Trying model: {model_name}")
            response = _client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            text = response.choices[0].message.content.strip()
            print(f"[Groq] Success with {model_name}")
            return text
        
        except Exception as e:
            error_str = str(e)
            short_error = error_str[:150]
            print(f"[Groq] {model_name} failed: {short_error}")
            last_error = e
            
            # On rate limit or decommissioned, try next model
            if '429' in error_str or 'rate' in error_str.lower():
                continue
            if 'decommissioned' in error_str or '400' in error_str:
                continue
            
            # Other error → raise
            raise e
    
    raise Exception(f"All Groq models failed. Last error: {last_error}")