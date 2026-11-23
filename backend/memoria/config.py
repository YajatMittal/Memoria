"""Application configuration, loaded from environment variables (see .env.example)."""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


class Config:
    # Used to sign auth tokens. MUST be set to a long random value outside local dev.
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-insecure-secret-key")

    # Relative SQLite paths resolve inside backend/instance/.
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///memoria.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Reject uploads larger than this before they hit the captioning model.
    MAX_CONTENT_LENGTH = 15 * 1024 * 1024
    MAX_IMAGE_DIMENSION = 1600  # px; photos are downscaled before storage

    AUTH_TOKEN_MAX_AGE = timedelta(days=30)
    VERIFICATION_CODE_TTL = timedelta(minutes=10)
    VERIFICATION_MAX_ATTEMPTS = 5

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # Google Gemini (memory assistant). The key lives ONLY on the server.
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

    # On-device-style image captioning with BLIP (Hugging Face transformers).
    CAPTION_MODEL = os.getenv("CAPTION_MODEL", "Salesforce/blip-image-captioning-base")

    # Outgoing email for verification codes. If SMTP_USER/SMTP_PASSWORD are not
    # set, codes are printed to the server log instead (handy for local dev).
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    MAIL_SENDER = os.getenv("MAIL_SENDER") or os.getenv("SMTP_USER")

    # Reverse geocoding (OpenStreetMap Nominatim requires an identifying User-Agent).
    NOMINATIM_URL = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org/reverse")
    NOMINATIM_USER_AGENT = os.getenv("NOMINATIM_USER_AGENT", "Memoria/1.0 (self-hosted)")

    DEBUG = _bool("FLASK_DEBUG")
