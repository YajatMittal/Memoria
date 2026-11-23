"""Location check-ins. The app reports the user's position; when it's somewhere
new, the app nudges them to take a photo and create a memory there."""

from flask import Blueprint, g, jsonify

from ..auth import login_required
from ..extensions import db
from ..models import Place
from ..services.geocoding import reverse_geocode
from ..utils import error, json_body

bp = Blueprint("places", __name__, url_prefix="/places")


@bp.post("/visit")
@login_required
def visit():
    data = json_body()
    try:
        lat, lon = float(data["latitude"]), float(data["longitude"])
    except (KeyError, TypeError, ValueError):
        return error("latitude and longitude are required numbers.")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return error("Coordinates are out of range.")

    found = reverse_geocode(lat, lon)
    if found is None:
        return jsonify({"place": None, "is_new": False})

    place = Place.query.filter_by(account_id=g.account.id, name=found["name"], address=found["address"]).first()
    is_new = place is None
    if is_new:
        place = Place(account_id=g.account.id, **found)
        db.session.add(place)
        db.session.commit()
    return jsonify({"place": place.to_dict(), "is_new": is_new})


@bp.get("")
@login_required
def list_places():
    places = Place.query.filter_by(account_id=g.account.id).order_by(Place.first_visited_at.desc()).all()
    return jsonify({"places": [p.to_dict() for p in places]})
