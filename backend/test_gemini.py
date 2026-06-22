"""
Test Gemini API directly to see what error happens.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

key = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded: {bool(key)}")
print(f"API Key starts with: {key[:10]}..." if key else "API Key is None!")
print(f"API Key length: {len(key) if key else 0}")
print()

if not key:
    print("ERROR: GEMINI_API_KEY not found in .env!")
    exit(1)

print("Creating Gemini client...")
try:
    client = genai.Client(api_key=key)
    print("Client created!")
except Exception as e:
    print(f"Client creation failed: {e}")
    exit(1)

print("\nSending test message...")
try:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Say hello in Khmer",
    )
    print(f"\nSUCCESS! Response:\n{response.text}")
except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {e}")