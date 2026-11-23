"""The memory assistant: answers "what did I do on <day>?" from the user's own
captioned photos, and otherwise acts as a gentle conversational companion."""

from datetime import date

from ..models import Account, Memory
from . import gemini

COMPANION_PROMPT = """You are Memoria, a warm, patient companion inside an app that helps people \
living with memory loss (such as Alzheimer's disease) and their caregivers.
- Use short sentences and simple, everyday words. Keep replies under 120 words.
- Be kind and reassuring. Never make the person feel bad for forgetting or repeating themselves.
- You are not a doctor. For health concerns, gently suggest talking to a doctor or caregiver.
- If someone seems lost, scared, or in danger, tell them to contact a family member, caregiver, \
or local emergency services."""

DATE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "asks_about_past_day": {
            "type": "BOOLEAN",
            "description": "True if the user wants to recall what happened / what they did on a specific day.",
        },
        "date": {
            "type": "STRING",
            "nullable": True,
            "description": "That day as YYYY-MM-DD, or null if no specific day is meant.",
        },
    },
    "required": ["asks_about_past_day"],
}


def _human(day: date, year: bool = False) -> str:
    """'Monday, March 3' (portable: avoids the non-Windows-safe %-d)."""
    text = f"{day:%A, %B} {day.day}"
    return f"{text}, {day.year}" if year else text


def _extract_date(message: str, today: date) -> date | None:
    prompt = (
        f"Today is {_human(today, year=True)} ({today.isoformat()}).\n"
        "Decide whether the user's message asks to recall a specific day (e.g. 'what did I do yesterday?', "
        "'show me last Saturday', 'what happened on March 3rd?'). Resolve relative dates against today. "
        "If no year is given, assume the most recent such date that is not in the future.\n"
        f'User message: "{message}"'
    )
    result = gemini.generate_json(prompt, DATE_SCHEMA)
    if not result.get("asks_about_past_day") or not result.get("date"):
        return None
    try:
        return date.fromisoformat(result["date"])
    except ValueError:
        return None


def _summarize_day(day: date, memories: list[Memory], today: date) -> str:
    lines = "\n".join(f"- {m.caption}" for m in memories)
    when = "today" if day == today else f"on {_human(day)}"
    prompt = (
        f"These are short descriptions of photos the person took {when}, in order:\n{lines}\n\n"
        "Gently retell their day to them in the second person ('You ...') in 2-4 short sentences, "
        "as a friendly reminder. Only use what the descriptions say; do not invent people, names or places."
    )
    return gemini.generate_text(prompt, system=COMPANION_PROMPT)


def respond(account: Account, message: str, today: date, history: list[dict]) -> dict:
    day = _extract_date(message, today)

    if day is None:
        reply = gemini.generate_text(message, system=COMPANION_PROMPT, history=history)
        return {"reply": reply, "date": None, "memories": []}

    memories = (
        Memory.query.filter_by(account_id=account.id, captured_on=day).order_by(Memory.captured_at).all()
    )
    if not memories:
        when = "today" if day == today else f"on {_human(day, year=True)}"
        reply = (
            f"I couldn't find any photos from {when}. "
            "When you take photos in Memoria, I can help you remember those days."
        )
        return {"reply": reply, "date": day.isoformat(), "memories": []}

    return {
        "reply": _summarize_day(day, memories, today),
        "date": day.isoformat(),
        "memories": [m.to_dict() for m in memories],
    }
