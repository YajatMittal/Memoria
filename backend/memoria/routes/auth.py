"""Sign up -> email verification code -> token. Login returns a token."""

import hmac
import re
import secrets

from flask import Blueprint, current_app, g, jsonify

from ..auth import issue_token, login_required
from ..extensions import db
from ..models import Account, utcnow
from ..services.email import send_verification_email
from ..utils import error, json_body

bp = Blueprint("auth", __name__, url_prefix="/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,30}$")


def _issue_code(account: Account) -> None:
    """Store a fresh one-time code (the caller commits)."""
    account.verification_code = f"{secrets.randbelow(10**6):06d}"
    account.verification_expires_at = utcnow() + current_app.config["VERIFICATION_CODE_TTL"]
    account.verification_attempts = 0


def _email_code(account: Account):
    """Send the code; returns an error response if delivery fails, else None."""
    try:
        send_verification_email(account.email, account.username, account.verification_code)
    except Exception:
        current_app.logger.exception("Failed to send verification email")
        return error("We couldn't send the verification email. Please try again.", 502)
    return None


def _session_payload(account: Account):
    return jsonify({"token": issue_token(account), "user": account.to_dict()})


@bp.post("/signup")
def signup():
    data = json_body()
    email = str(data.get("email", "")).strip().lower()
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if not EMAIL_RE.match(email):
        return error("Please enter a valid email address.")
    if not USERNAME_RE.match(username):
        return error("Usernames must be 3–30 characters: letters, numbers, '.', '_' or '-'.")
    if len(password) < 8:
        return error("Passwords must be at least 8 characters.")

    account = Account.query.filter_by(email=email).first()
    if account and account.is_verified:
        return error("An account with this email already exists. Try logging in.", 409)

    owner = Account.query.filter_by(username=username).first()
    if owner and owner is not account:
        return error("That username is taken. Please choose another.", 409)

    # An unverified account with this email can be re-claimed (e.g. a lost code).
    if account is None:
        account = Account(email=email, username=username)
        db.session.add(account)
    account.username = username
    account.set_password(password)
    _issue_code(account)
    db.session.commit()

    if failure := _email_code(account):
        return failure
    return jsonify({"account_id": account.id, "email": account.email}), 201


@bp.post("/verify")
def verify():
    data = json_body()
    account = db.session.get(Account, data.get("account_id")) if data.get("account_id") else None
    code = str(data.get("code", "")).strip()

    if account is None:
        return error("We couldn't find that account. Please sign up again.", 404)
    if account.is_verified:
        return _session_payload(account)
    if not account.verification_code or account.verification_attempts >= current_app.config["VERIFICATION_MAX_ATTEMPTS"]:
        return error("This code is no longer valid. Please request a new one.", 410)

    expires = account.verification_expires_at
    if expires is not None and expires.tzinfo is None:  # SQLite stores naive UTC
        expires = expires.replace(tzinfo=utcnow().tzinfo)
    if expires is None or expires < utcnow():
        return error("This code has expired. Please request a new one.", 410)

    if not hmac.compare_digest(code, account.verification_code):
        account.verification_attempts += 1
        db.session.commit()
        return error("That code isn't right. Please check your email and try again.", 401)

    account.is_verified = True
    account.verification_code = None
    account.verification_expires_at = None
    db.session.commit()
    return _session_payload(account)


@bp.post("/resend")
def resend():
    data = json_body()
    account = db.session.get(Account, data.get("account_id")) if data.get("account_id") else None
    if account is None or account.is_verified:
        return error("Nothing to resend for this account.", 400)
    _issue_code(account)
    db.session.commit()
    if failure := _email_code(account):
        return failure
    return jsonify({"message": "A new code is on its way."})


@bp.post("/login")
def login():
    data = json_body()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    account = Account.query.filter_by(email=email).first()
    # Same message for unknown email and wrong password, so emails can't be enumerated.
    if account is None or not account.check_password(password):
        return error("Incorrect email or password.", 401)
    if not account.is_verified:
        return error("Please verify your email first.", 403, account_id=account.id)
    return _session_payload(account)


@bp.get("/me")
@login_required
def me():
    return jsonify({"user": g.account.to_dict()})
