"""Reverse geocoding via OpenStreetMap Nominatim.

Done server-side so the app doesn't need a third-party CORS proxy and so we can
send the identifying User-Agent that Nominatim's usage policy requires.
"""

import requests
from flask import current_app


def reverse_geocode(latitude: float, longitude: float) -> dict | None:
    """Return {"name": ..., "address": ...} for a coordinate, or None on failure."""
    cfg = current_app.config
    try:
        response = requests.get(
            cfg["NOMINATIM_URL"],
            params={"lat": latitude, "lon": longitude, "format": "jsonv2", "zoom": 18},
            headers={"User-Agent": cfg["NOMINATIM_USER_AGENT"]},
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError):
        current_app.logger.warning("Reverse geocoding failed", exc_info=True)
        return None

    addr = data.get("address") or {}
    if not addr:
        return None

    name = (
        data.get("name")
        or addr.get("amenity")
        or addr.get("road")
        or addr.get("neighbourhood")
        or addr.get("suburb")
        or "Unnamed place"
    )
    locality = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality")
    address = ", ".join(part for part in (locality, addr.get("state"), addr.get("country")) if part)
    return {"name": name[:150], "address": (address or data.get("display_name", ""))[:300]}
