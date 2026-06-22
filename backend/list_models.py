"""
List all available Gemini models for your API key.
"""
import os
from pathlib import Path
from google import genai
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=key)

print("Available models:")
print("=" * 70)
for model in client.models.list():
    print(f"\nName: {model.name}")
    if hasattr(model, 'display_name'):
        print(f"  Display: {model.display_name}")
    if hasattr(model, 'supported_actions'):
        print(f"  Actions: {model.supported_actions}")