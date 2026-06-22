"""
Email service for sending OTP verification codes.
Uses Gmail SMTP with App Password.
"""
import smtplib
import os
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "EduMatch")

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP code."""
    return ''.join(random.choices(string.digits, k=length))


def send_verification_email(to_email: str, name: str, otp_code: str) -> bool:
    """
    Send OTP verification email.
    Returns True if sent successfully, False otherwise.
    """
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("[EMAIL ERROR] EMAIL_USER or EMAIL_PASSWORD not set in .env")
        return False

    try:
        # Build email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"EduMatch - លេខកូដផ្ទៀងផ្ទាត់ / Verification Code"
        msg['From'] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
        msg['To'] = to_email

        # HTML body (bilingual Khmer + English)
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #8b5cf6, #a855f7); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; border-radius: 0 0 12px 12px; }}
                .otp-box {{ background: #f3f4f6; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }}
                .otp-code {{ font-size: 36px; font-weight: bold; color: #8b5cf6; letter-spacing: 8px; font-family: 'Courier New', monospace; }}
                .footer {{ color: #888; font-size: 12px; text-align: center; margin-top: 20px; }}
                .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EduMatch</h1>
                </div>
                <div class="content">
                    <h2>សួស្តី {name}! / Hello {name}!</h2>
                    
                    <p>សូមអរគុណសម្រាប់ការចុះឈ្មោះជាមួយ EduMatch។</p>
                    <p>Thank you for registering with EduMatch.</p>
                    
                    <p><strong>លេខកូដផ្ទៀងផ្ទាត់របស់អ្នក / Your verification code:</strong></p>
                    
                    <div class="otp-box">
                        <div class="otp-code">{otp_code}</div>
                    </div>
                    
                    <p>សូមបញ្ចូលលេខកូដនេះក្នុងកម្មវិធី EduMatch ដើម្បីបញ្ចប់ការចុះឈ្មោះ។</p>
                    <p>Enter this code in the EduMatch app to complete your registration.</p>
                    
                    <div class="warning">
                        <strong>⚠️ សំខាន់ / Important:</strong><br>
                        លេខកូដនេះនឹងផុតកំណត់ក្នុង 10 នាទី។<br>
                        This code will expire in 10 minutes.
                    </div>
                    
                    <p style="color: #666; font-size: 13px;">
                        ប្រសិនបើអ្នកមិនបានចុះឈ្មោះ សូមមិនអើពើនឹងអ៊ីមែលនេះ។<br>
                        If you did not register, please ignore this email.
                    </p>
                </div>
                <div class="footer">
                    © 2026 EduMatch - AI-Powered Higher Education Recommendation
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text fallback
        text = f"""
EduMatch - Verification Code

Hello {name}!

Thank you for registering with EduMatch.

Your verification code: {otp_code}

This code will expire in 10 minutes.
Enter this code in the EduMatch app to complete registration.

If you did not register, please ignore this email.
        """

        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))

        # Send via Gmail SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)

        print(f"[EMAIL] Sent verification code to {to_email}")
        return True

    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {str(e)}")
        return False