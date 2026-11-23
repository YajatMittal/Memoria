from datetime import date

from flask import jsonify, request


def error(message: str, status: int = 400, **extra):
    """Consistent JSON error shape: {"error": "...", ...}."""
    return jsonify({"error": message, **extra}), status


def json_body() -> dict:
    """Request JSON as a dict (empty dict if the body is missing or malformed)."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def parse_iso_date(value) -> date | None:
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None
