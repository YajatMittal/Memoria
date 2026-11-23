"""Seed a Memoria demo database for screen recording.

Run from backend/:
    DATABASE_URL=sqlite:///demo.db python /path/to/seed_demo.py [--photos DIR]

Photos in DIR (jpg/png, sorted by filename) are paired with the captions below
in order; any missing photos get a soft placeholder image.
Login afterwards with  demo@memoria.app / memoria-demo
"""

import argparse
import io
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))

from PIL import Image, ImageDraw, ImageOps  # noqa: E402

from memoria import create_app  # noqa: E402
from memoria.extensions import db  # noqa: E402
from memoria.models import Account, ForumComment, ForumPost, Memory  # noqa: E402

# (days ago, hour, caption)
MEMORIES = [
    (0, 9, "a cup of coffee with latte art on a wooden table"),
    (0, 11, "purple flowers blooming in a garden"),
    (1, 10, "an older man sitting at a table in a cafe"),
    (1, 15, "a black puppy sitting on a wooden floor"),
    (1, 18, "a couple sitting on a bench looking at the sea"),
    (2, 14, "sailboats docked in a harbor"),
    (4, 9, "a bowl of yogurt with strawberries and granola"),
    (4, 15, "cookies and yellow flowers on a table"),
    (6, 10, "a box of fresh strawberries at a market"),
]

COLORS = [(244, 196, 120), (150, 200, 160), (160, 180, 230), (230, 160, 170), (190, 170, 220)]


def placeholder(i: int) -> bytes:
    w, h = 1200, 900
    a, b = COLORS[i % len(COLORS)], COLORS[(i + 2) % len(COLORS)]
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=tuple(int(a[k] * (1 - t) + b[k] * t) for k in range(3)))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85)
    return buf.getvalue()


def load_photo(path: Path) -> bytes:
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    img.thumbnail((1600, 1600))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85)
    return buf.getvalue()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--photos", type=Path)
    args = ap.parse_args()
    photos = []
    if args.photos:
        photos = sorted(p for p in args.photos.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".heic"})

    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        def account(email, username):
            a = Account(email=email, username=username, is_verified=True)
            a.set_password("memoria-demo")
            db.session.add(a)
            return a

        me = account("demo@memoria.app", "Margaret")
        sarah = account("sarah@example.com", "SarahCares")
        tom = account("tom@example.com", "TomH")
        db.session.flush()

        today = date.today()
        for i, (ago, hour, caption) in enumerate(MEMORIES):
            day = today - timedelta(days=ago)
            image = load_photo(photos[i]) if i < len(photos) else placeholder(i)
            db.session.add(Memory(
                account_id=me.id, image=image, mime_type="image/jpeg", caption=caption, captured_on=day,
                captured_at=datetime(day.year, day.month, day.day, hour).astimezone(timezone.utc),
            ))

        now = datetime.now(timezone.utc)
        p1 = ForumPost(account_id=sarah.id, title="Tips for a calmer evening routine",
                       content="My dad gets anxious around sunset. Looking at the day's photos together "
                               "with him has really helped. What works for your family?",
                       created_at=now - timedelta(days=2))
        p2 = ForumPost(account_id=tom.id, title="Just started using Memoria with my mom",
                       content="She asked 'what did I do yesterday?' and smiled when it told her about "
                               "lunch with the grandkids. Small wins!",
                       created_at=now - timedelta(days=1))
        db.session.add_all([p1, p2])
        db.session.flush()
        db.session.add_all([
            ForumComment(post_id=p1.id, account_id=tom.id, content="Soft music and the same chair every evening help us.",
                         created_at=now - timedelta(days=1, hours=20)),
            ForumComment(post_id=p2.id, account_id=sarah.id, content="That's wonderful to hear. Small wins add up.",
                         created_at=now - timedelta(hours=10)),
        ])
        db.session.commit()
        print(f"Seeded {len(MEMORIES)} memories ({min(len(photos), len(MEMORIES))} real photos), 2 forum posts.")
        print("Login: demo@memoria.app / memoria-demo")


if __name__ == "__main__":
    main()
