"""
Smart AI client with multi-provider fallback:
1. Gemini (best Khmer quality, limited free tier)
2. Groq (very fast, generous free tier) — fallback
"""
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Import Groq fallback
try:
    from .groq_client import generate_response_groq, is_groq_available
    GROQ_ENABLED = is_groq_available()
except Exception as e:
    print(f"[WARN] Groq fallback unavailable: {e}")
    GROQ_ENABLED = False

ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not set in .env")

_client = genai.Client(api_key=GEMINI_API_KEY)

# Try Gemini models in order
GEMINI_MODELS = [
    "gemini-2.5-flash-lite",     # Most generous free quota
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
]

MAX_RETRIES_PER_MODEL = 2
RETRY_DELAY_SECONDS = 2


def _try_gemini_model(model_name: str, prompt: str, config) -> str:
    """Try a Gemini model with retries on 503."""
    last_error = None
    
    for attempt in range(MAX_RETRIES_PER_MODEL):
        try:
            response = _client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            return response.text.strip()
        
        except Exception as e:
            error_str = str(e)
            last_error = e
            
            if '503' in error_str or 'UNAVAILABLE' in error_str:
                if attempt < MAX_RETRIES_PER_MODEL - 1:
                    wait = RETRY_DELAY_SECONDS * (attempt + 1)
                    print(f"[Gemini] {model_name} overloaded, retry {attempt+1}/{MAX_RETRIES_PER_MODEL} in {wait}s...")
                    time.sleep(wait)
                    continue
            
            raise e
    
    raise last_error


def generate_response(prompt: str, system_instruction: str = None) -> str:
    """
    Generate response with smart fallback:
    Gemini models → Groq Llama
    """
    config_args = {
        'temperature': 0.7,
        'max_output_tokens': 1024,
    }
    if system_instruction:
        config_args['system_instruction'] = system_instruction
    
    config = types.GenerateContentConfig(**config_args)
    
    # === Stage 1: Try Gemini models ===
    for model_name in GEMINI_MODELS:
        try:
            print(f"[AI] Trying Gemini: {model_name}")
            result = _try_gemini_model(model_name, prompt, config)
            print(f"[AI] Success with Gemini {model_name}")
            return result
        
        except Exception as e:
            error_str = str(e)
            
            # Rate limit or overload → try next model
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str or '503' in error_str or 'UNAVAILABLE' in error_str:
                print(f"[AI] Gemini {model_name} unavailable, trying next...")
                continue
            
            # Other errors → still try Groq as last resort
            print(f"[AI] Gemini {model_name} unexpected error: {error_str[:150]}")
            break
    
    # === Stage 2: Fallback to Groq ===
    if GROQ_ENABLED:
        try:
            print("[AI] All Gemini models failed, falling back to Groq...")
            return generate_response_groq(prompt, system_instruction)
        except Exception as e:
            print(f"[AI] Groq also failed: {str(e)[:200]}")
            raise
    
    raise Exception("All AI providers exhausted (Gemini + Groq)")


def generate_response_stream(prompt: str, system_instruction: str = None):
    """
    STREAMING version - yields text chunks as Gemini generates them.
    Falls back to Groq (non-streaming) if all Gemini models fail.
    
    Usage:
        for chunk in generate_response_stream(prompt, system):
            print(chunk, end='')
    """
    config_args = {
        'temperature': 0.7,
        'max_output_tokens': 1024,
    }
    if system_instruction:
        config_args['system_instruction'] = system_instruction
    
    config = types.GenerateContentConfig(**config_args)
    
    # === Stage 1: Try Gemini models with streaming ===
    for model_name in GEMINI_MODELS:
        try:
            print(f"[AI Stream] Trying Gemini: {model_name}")
            
            stream = _client.models.generate_content_stream(
                model=model_name,
                contents=prompt,
                config=config,
            )
            
            got_any = False
            for chunk in stream:
                if chunk.text:
                    got_any = True
                    yield chunk.text
            
            if got_any:
                print(f"[AI Stream] Success with Gemini {model_name}")
                return
            
            # No text came back, try next model
            print(f"[AI Stream] {model_name} returned empty, trying next...")
            continue
        
        except Exception as e:
            error_str = str(e)
            
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str or '503' in error_str or 'UNAVAILABLE' in error_str:
                print(f"[AI Stream] Gemini {model_name} unavailable, trying next...")
                continue
            
            print(f"[AI Stream] Gemini {model_name} unexpected error: {error_str[:150]}")
            break
    
    # === Stage 2: Fallback to Groq (non-streaming, yield as one chunk) ===
    if GROQ_ENABLED:
        try:
            print("[AI Stream] All Gemini failed, falling back to Groq (no stream)...")
            full = generate_response_groq(prompt, system_instruction)
            yield full
            return
        except Exception as e:
            print(f"[AI Stream] Groq also failed: {str(e)[:200]}")
    
    # Total failure
    yield "[ERROR]"


def detect_language(text: str) -> str:
    """Detect if text is Khmer or English."""
    if not text:
        return 'en'
    khmer_chars = sum(1 for c in text if '\u1780' <= c <= '\u17ff')
    total_chars = sum(1 for c in text if c.isalpha() or '\u1780' <= c <= '\u17ff')
    
    if total_chars == 0:
        return 'en'
    
    return 'km' if (khmer_chars / total_chars) > 0.3 else 'en'