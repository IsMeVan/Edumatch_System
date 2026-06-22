"""
translator.py
Translates Khmer ↔ English using Groq with automatic model fallback.
"""
import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

GROQ_API_KEY = os.getenv('GROQ_API_KEY')

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not set in .env")

_client = Groq(api_key=GROQ_API_KEY)

# Try models in order (each has separate quota)
FALLBACK_MODELS = [
    "llama-3.1-8b-instant",         # Smaller, more quota
    "llama-3.3-70b-versatile",      # Bigger, better quality
    "gemma2-9b-it",                  # Different family, separate quota
]

CACHE_FILE = Path(__file__).parent / "translation_cache.json"

if CACHE_FILE.exists():
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        _cache = json.load(f)
    print(f"[Translator] Loaded {len(_cache)} cached translations")
else:
    _cache = {}


def _save_cache():
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(_cache, f, ensure_ascii=False, indent=2)


def _translate_with_model(text: str, model: str) -> str:
    """Try translating with a specific model."""
    response = _client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a translator. Translate the user's text to clear English. "
                    "Keep proper nouns (school names, places) as-is. "
                    "Return ONLY the English translation, no explanations, no quotes."
                )
            },
            {"role": "user", "content": text}
        ],
        temperature=0.1,
        max_tokens=200,
    )
    return response.choices[0].message.content.strip().strip('"').strip("'")


def translate_to_english(text: str, force: bool = False) -> str:
    if not text or not text.strip():
        return ""
    
    text = text.strip()
    cache_key = f"en::{text}"
    
    if not force and cache_key in _cache:
        return _cache[cache_key]
    
    # Try each model in order
    last_error = None
    for model in FALLBACK_MODELS:
        try:
            translated = _translate_with_model(text, model)
            _cache[cache_key] = translated
            _save_cache()
            return translated
        except Exception as e:
            error_str = str(e)
            last_error = e
            # If rate limited, try next model
            if '429' in error_str or 'rate_limit' in error_str.lower():
                print(f"[Translator] {model} rate limited, trying next...")
                continue
            else:
                raise e
    
    # All models failed
    print(f"[Translator] ALL models failed. Last error: {last_error}")
    return text  # Fallback: return original


def translate_batch_to_english(texts: list[str], show_progress: bool = True) -> list[str]:
    results = []
    total = len(texts)
    cached_count = 0
    translated_count = 0
    error_count = 0
    
    for i, text in enumerate(texts):
        if show_progress and i % 50 == 0:
            print(f"  Progress: {i}/{total} (cached: {cached_count}, translated: {translated_count}, errors: {error_count})")
        
        cache_key = f"en::{text.strip()}"
        if cache_key in _cache:
            results.append(_cache[cache_key])
            cached_count += 1
        else:
            try:
                translated = translate_to_english(text)
                results.append(translated)
                if translated == text:
                    error_count += 1
                else:
                    translated_count += 1
            except Exception as e:
                print(f"  [ERROR] {text[:50]}... → {e}")
                results.append(text)
                error_count += 1
                # Small delay if hitting limits
                time.sleep(2)
    
    print(f"\n[Translator] Done! Cached: {cached_count}, Translated: {translated_count}, Errors: {error_count}")
    return results