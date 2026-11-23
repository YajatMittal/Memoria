"""Outgoing email (verification codes)."""

import smtplib
from email.message import EmailMessage

from flask import current_app

VERIFICATION_BODY = """Hi {username},

Thanks for signing up for Memoria! Enter this code in the app to verify your email:

    {code}

The code expires in {minutes} minutes. If you didn't sign up for Memoria, you can ignore this email.

— The Memoria team
(This is an automated message. Please don't reply.)
"""


def send_verification_email(to: str, username: str, code: str) -> None:
    cfg = current_app.config
    minutes = int(cfg["VERIFICATION_CODE_TTL"].total_seconds() // 60)

    if not (cfg["SMTP_USER"] and cfg["SMTP_PASSWORD"]):
        # Local development without email credentials: log the code instead.
        current_app.logger.warning("SMTP not configured. Verification code for %s: %s", to, code)
        return

    msg = EmailMessage()
    msg["Subject"] = "Your Memoria verification code"
    msg["From"] = cfg["MAIL_SENDER"]
    msg["To"] = to
    msg.set_content(VERIFICATION_BODY.format(username=username, code=code, minutes=minutes))

    with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=15) as smtp:
        smtp.starttls()
        smtp.login(cfg["SMTP_USER"], cfg["SMTP_PASSWORD"])
        smtp.send_message(msg)
