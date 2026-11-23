"""Stateless bearer-token auth using signed, time-limited tokens."""

from functools import wraps

from flask import current_app, g, request
from itsdangerous import BadSignature, URLSafeTimedSerializer

from .extensions import db
from .models import Account
from .utils import error

_SALT = "memoria-auth-token"


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt=_SALT)


def issue_token(account: Account) -> str:
    return _serializer().dumps({"uid": account.id})


def _account_from_token(token: str) -> Account | None:
    max_age = int(current_app.config["AUTH_TOKEN_MAX_AGE"].total_seconds())
    try:
        payload = _serializer().loads(token, max_age=max_age)
    except BadSignature:  # also covers SignatureExpired
        return None
    account = db.session.get(Account, payload.get("uid"))
    return account if account and account.is_verified else None


def login_required(view):
    """Require `Authorization: Bearer <token>` and expose the user as `g.account`."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        scheme, _, token = header.partition(" ")
        if scheme.lower() != "bearer" or not token:
            return error("Please log in to continue.", 401)
        account = _account_from_token(token.strip())
        if account is None:
            return error("Your session has expired. Please log in again.", 401)
        g.account = account
        return view(*args, **kwargs)

    return wrapper
