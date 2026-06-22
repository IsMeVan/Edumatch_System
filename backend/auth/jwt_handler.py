from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from PROJECT ROOT (one level up from backend/)
ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

bearer = HTTPBearer()
SECRET = os.getenv("SECRET_KEY", "changeme")
ALGO = os.getenv("ALGORITHM", "HS256")


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    """Decode the JWT token and return the current user."""
    try:
        payload = jwt.decode(creds.credentials, SECRET, algorithms=[ALGO])
        return {"id": int(payload["sub"]), "email": payload["email"]}
    except JWTError as e:
        print(f"[JWT Error] {e}")
        print(f"[JWT Debug] SECRET starts with: {SECRET[:5]}..., ALGO: {ALGO}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )