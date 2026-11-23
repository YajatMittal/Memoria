from datetime import date

from flask import Blueprint, g, jsonify

from ..auth import login_required
from ..services import assistant
from ..services.gemini import GeminiUnavailable
from ..utils import error, json_body, parse_iso_date

bp = Blueprint("assistant", __name__, url_prefix="/assistant")

MAX_MESSAGE_LENGTH = 1000
MAX_HISTORY_TURNS = 10


@bp.post("/chat")
@login_required
def chat():
    data = json_body()
    message = str(data.get("message", "")).strip()
    if not message:
        return error("Please type a message.")
    if len(message) > MAX_MESSAGE_LENGTH:
        return error("That message is a bit long. Please shorten it.")

    # The client sends its local date so "today"/"yesterday" match the user's timezone.
    today = parse_iso_date(data.get("today")) or date.today()

    history = [
        {"role": "model" if turn.get("role") == "assistant" else "user", "text": str(turn.get("text", ""))[:MAX_MESSAGE_LENGTH]}
        for turn in (data.get("history") or [])[-MAX_HISTORY_TURNS:]
        if isinstance(turn, dict) and turn.get("text")
    ]

    try:
        return jsonify(assistant.respond(g.account, message, today, history))
    except GeminiUnavailable:
        return error("The assistant is unavailable right now. Please try again in a moment.", 503)
