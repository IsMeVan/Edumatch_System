from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
import os
import datetime
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

from db.database import get_db
from services.email_service import send_verification_email, generate_otp

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET = os.getenv("SECRET_KEY", "changeme")
ALGO = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
OTP_EXPIRE_MINUTES = 10


# Request body schemas
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str


class VerifyOTPIn(BaseModel):
    email: EmailStr
    otp_code: str


class ResendOTPIn(BaseModel):
    email: EmailStr


class LoginIn(BaseModel):
    email: EmailStr
    password: str


def make_token(user_id: int, email: str) -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=EXPIRE_MIN)
    return jwt.encode(
        {"sub": str(user_id), "email": email, "exp": expire},
        SECRET,
        algorithm=ALGO
    )


@router.post("/register", status_code=201)
def register(body: RegisterIn, conn=Depends(get_db)):
    """
    Step 1 of registration:
    - Create user account (unverified)
    - Generate OTP code
    - Send code to user's email
    - User must verify before login
    """
    cur = conn.cursor()

    # Check if email already exists
    cur.execute("SELECT id, is_verified FROM users WHERE email = %s", (body.email,))
    existing = cur.fetchone()
    
    if existing:
        if existing[1]:  # is_verified
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            # User exists but not verified - resend new OTP
            otp = generate_otp()
            expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_EXPIRE_MINUTES)
            
            cur.execute(
                "UPDATE users SET verification_code = %s, verification_expires = %s WHERE id = %s",
                (otp, expires, existing[0])
            )
            conn.commit()
            
            email_sent = send_verification_email(body.email, body.name, otp)
            
            if not email_sent:
                raise HTTPException(status_code=500, detail="Failed to send verification email")
            
            return {
                "message": "Verification code sent",
                "email": body.email,
                "requires_verification": True
            }

    # New user - create account
    hashed = pwd_ctx.hash(body.password)
    otp = generate_otp()
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_EXPIRE_MINUTES)
    
    cur.execute(
        """
        INSERT INTO users (name, email, password_hash, is_verified, verification_code, verification_expires)
        VALUES (%s, %s, %s, FALSE, %s, %s)
        RETURNING id
        """,
        (body.name, body.email, hashed, otp, expires)
    )
    user_id = cur.fetchone()[0]
    conn.commit()

    # Send verification email
    email_sent = send_verification_email(body.email, body.name, otp)
    
    if not email_sent:
        # Rollback: delete user if email failed
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please check your email address.")

    return {
        "message": "Verification code sent to your email",
        "email": body.email,
        "requires_verification": True
    }


@router.post("/verify-otp")
def verify_otp(body: VerifyOTPIn, conn=Depends(get_db)):
    """
    Step 2 of registration:
    - User submits 6-digit OTP code
    - System verifies code
    - If valid: mark user as verified, return login token
    - If invalid/expired: return error
    """
    cur = conn.cursor()
    
    cur.execute(
        """
        SELECT id, name, is_verified, verification_code, verification_expires, is_admin
        FROM users WHERE email = %s
        """,
        (body.email,)
    )
    row = cur.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id, name, is_verified, stored_code, expires, is_admin = row
    
    if is_verified:
        raise HTTPException(status_code=400, detail="Email already verified. Please login.")
    
    if not stored_code or not expires:
        raise HTTPException(status_code=400, detail="No verification code. Please register again.")
    
    # Check expiration
    if datetime.datetime.utcnow() > expires:
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")
    
    # Check code match
    if body.otp_code.strip() != stored_code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark as verified, clear code
    cur.execute(
        """
        UPDATE users 
        SET is_verified = TRUE, verification_code = NULL, verification_expires = NULL
        WHERE id = %s
        """,
        (user_id,)
    )
    conn.commit()
    
    # Generate login token
    token = make_token(user_id, body.email)
    
    return {
        "message": "Email verified successfully",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": body.email,
            "is_admin": is_admin if is_admin is not None else False,
        }
    }


@router.post("/resend-otp")
def resend_otp(body: ResendOTPIn, conn=Depends(get_db)):
    """Resend a new OTP code if user didn't receive or it expired."""
    cur = conn.cursor()
    
    cur.execute(
        "SELECT id, name, is_verified FROM users WHERE email = %s",
        (body.email,)
    )
    row = cur.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id, name, is_verified = row
    
    if is_verified:
        raise HTTPException(status_code=400, detail="Email already verified. Please login.")
    
    # Generate new OTP
    otp = generate_otp()
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_EXPIRE_MINUTES)
    
    cur.execute(
        "UPDATE users SET verification_code = %s, verification_expires = %s WHERE id = %s",
        (otp, expires, user_id)
    )
    conn.commit()
    
    email_sent = send_verification_email(body.email, name, otp)
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"message": "New verification code sent"}


@router.post("/login")
def login(body: LoginIn, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, password_hash, is_admin, is_verified FROM users WHERE email = %s",
        (body.email,)
    )
    row = cur.fetchone()

    if not row or not pwd_ctx.verify(body.password, row[2]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if email verified
    is_verified = row[4] if row[4] is not None else False
    if not is_verified:
        raise HTTPException(
            status_code=403, 
            detail="Email not verified. Please check your email for verification code."
        )

    token = make_token(row[0], body.email)
    return {
        "token": token,
        "user": {
            "id": row[0], 
            "name": row[1], 
            "email": body.email,
            "is_admin": row[3] if row[3] is not None else False,
        }
    }