"""Captured photos ("memories"): upload + auto-caption, browse by day, delete."""

import io
from datetime import date

from flask import Blueprint, current_app, g, jsonify, request
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import func

from ..auth import login_required
from ..extensions import db
from ..models import Memory
from ..services import captioning
from ..utils import error, parse_iso_date

bp = Blueprint("memories", __name__, url_prefix="/memories")


def _normalize(raw: bytes) -> tuple[Image.Image, bytes]:
    """Fix EXIF rotation, convert to RGB, downscale, and re-encode as JPEG.

    Keeps the database small (full-resolution phone photos are several MB each)
    and strips EXIF metadata such as GPS coordinates.
    """
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    limit = current_app.config["MAX_IMAGE_DIMENSION"]
    image.thumbnail((limit, limit))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85, optimize=True)
    return image, buffer.getvalue()


@bp.post("")
@login_required
def create_memory():
    upload = request.files.get("image")
    if upload is None:
        return error("Please attach a photo.")

    captured_on = parse_iso_date(request.form.get("captured_on")) or date.today()

    try:
        image, jpeg = _normalize(upload.read())
    except (UnidentifiedImageError, OSError):
        return error("That file doesn't look like a photo.")

    try:
        caption = captioning.caption_image(image)
    except Exception:
        current_app.logger.exception("Captioning failed")
        caption = "A photo"

    memory = Memory(account_id=g.account.id, image=jpeg, caption=caption, captured_on=captured_on)
    db.session.add(memory)
    db.session.commit()
    return jsonify({"memory": memory.to_dict()}), 201


@bp.get("")
@login_required
def list_memories():
    day = parse_iso_date(request.args.get("date"))
    if day is None:
        return error("Please provide a date as YYYY-MM-DD.")
    memories = (
        Memory.query.filter_by(account_id=g.account.id, captured_on=day).order_by(Memory.captured_at).all()
    )
    return jsonify({"memories": [m.to_dict() for m in memories]})


@bp.get("/days")
@login_required
def days_with_memories():
    """Which days have photos (used to mark the calendar), with a count per day."""
    rows = (
        db.session.query(Memory.captured_on, func.count(Memory.id))
        .filter(Memory.account_id == g.account.id)
        .group_by(Memory.captured_on)
        .all()
    )
    return jsonify({"days": {day.isoformat(): count for day, count in rows}})


@bp.delete("/<int:memory_id>")
@login_required
def delete_memory(memory_id: int):
    memory = Memory.query.filter_by(id=memory_id, account_id=g.account.id).first()
    if memory is None:
        return error("Memory not found.", 404)
    db.session.delete(memory)
    db.session.commit()
    return "", 204
