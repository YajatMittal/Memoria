"""Thin wrapper around the Google Gen AI SDK so the rest of the app (and tests)
don't depend on SDK details."""

import json

from flask import current_app


class GeminiUnavailable(RuntimeError):
    """Raised when Gemini is not configured or the request fails."""


_client = None


def _get_client():
    global _client
    api_key = current_app.config.get("GEMINI_API_KEY")
    if not api_key:
        raise GeminiUnavailable("GEMINI_API_KEY is not set on the server.")
    if _client is None:
        from google import genai

        _client = genai.Client(api_key=api_key)
    return _client


def generate_text(prompt: str, *, system: str | None = None, history: list[dict] | None = None) -> str:
    """Generate a plain-text reply. `history` is a list of {"role": "user"|"model", "text": str}."""
    from google.genai import types

    contents = [
        types.Content(role=turn["role"], parts=[types.Part(text=turn["text"])]) for turn in (history or [])
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))
    try:
        response = _get_client().models.generate_content(
            model=current_app.config["GEMINI_MODEL"],
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system) if system else None,
        )
    except GeminiUnavailable:
        raise
    except Exception as exc:  # network / quota / safety errors
        current_app.logger.exception("Gemini request failed")
        raise GeminiUnavailable(str(exc)) from exc
    return (response.text or "").strip()


def generate_json(prompt: str, schema: dict) -> dict:
    """Generate a JSON object matching an OpenAPI-style `schema`."""
    from google.genai import types

    try:
        response = _get_client().models.generate_content(
            model=current_app.config["GEMINI_MODEL"],
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema.model_validate(schema),
                temperature=0,
            ),
        )
        return json.loads(response.text or "{}")
    except GeminiUnavailable:
        raise
    except Exception as exc:
        current_app.logger.exception("Gemini JSON request failed")
        raise GeminiUnavailable(str(exc)) from exc
