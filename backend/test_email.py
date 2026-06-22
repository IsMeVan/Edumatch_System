"""Test if Gmail credentials work."""
import os
from pathlib import Path
from dotenv import load_dotenv
import smtplib

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
print(f"Looking for .env at: {ENV_PATH}")
print(f"File exists: {ENV_PATH.exists()}")

load_dotenv(dotenv_path=ENV_PATH)

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

print(f"\nEMAIL_USER: '{EMAIL_USER}'")
print(f"EMAIL_PASSWORD length: {len(EMAIL_PASSWORD) if EMAIL_PASSWORD else 0}")
print(f"EMAIL_PASSWORD first 4 chars: '{EMAIL_PASSWORD[:4] if EMAIL_PASSWORD else 'NONE'}'")
print(f"EMAIL_PASSWORD has spaces: {' ' in EMAIL_PASSWORD if EMAIL_PASSWORD else 'N/A'}")

if not EMAIL_USER or not EMAIL_PASSWORD:
    print("\nVariables not loaded!")
    exit()

print("\nConnecting to Gmail SMTP...")
try:
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        print("Trying to login...")
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        print("\nSUCCESS! Credentials work!")
except smtplib.SMTPAuthenticationError as e:
    print(f"\nAUTH FAILED: {e}")
    print("\nPossible issues:")
    print("1. App Password is wrong/expired")
    print("2. Using regular password instead of App Password")
    print("3. Email username is wrong")
except Exception as e:
    print(f"\nERROR: {e}")