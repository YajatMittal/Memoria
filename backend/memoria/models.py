"""Database models."""

import base64
from datetime import date, datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso_utc(value: datetime | None) -> str | None:
    """Serialize a timestamp as ISO-8601 UTC (SQLite drops tzinfo, so re-attach it)."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


class Account(db.Model):
    __tablename__ = "accounts"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(254), nullable=False, unique=True, index=True)
    username = db.Column(db.String(30), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    verification_code = db.Column(db.String(6))
    verification_expires_at = db.Column(db.DateTime(timezone=True))
    verification_attempts = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    memories = db.relationship("Memory", back_populates="account", cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {"id": self.id, "email": self.email, "username": self.username}


class Memory(db.Model):
    """A captioned photo the user captured on a given (local) day."""

    __tablename__ = "memories"
    __table_args__ = (db.Index("ix_memories_account_day", "account_id", "captured_on"),)

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False)
    image = db.Column(db.LargeBinary, nullable=False)
    mime_type = db.Column(db.String(32), nullable=False, default="image/jpeg")
    caption = db.Column(db.Text, nullable=False)
    # The user's local calendar day, sent by the client so that "today" means
    # the user's today rather than the server's (UTC) today.
    captured_on = db.Column(db.Date, nullable=False, default=date.today)
    captured_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    account = db.relationship("Account", back_populates="memories")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "caption": self.caption,
            "captured_on": self.captured_on.isoformat(),
            "captured_at": iso_utc(self.captured_at),
            "image": base64.b64encode(self.image).decode("ascii"),
            "mime_type": self.mime_type,
        }


class Place(db.Model):
    """A place the user has visited, used to nudge them to capture new memories."""

    __tablename__ = "places"
    __table_args__ = (db.UniqueConstraint("account_id", "name", "address"),)

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.String(300), nullable=False)
    first_visited_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "first_visited_at": iso_utc(self.first_visited_at),
        }


class ForumPost(db.Model):
    __tablename__ = "forum_posts"

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    author = db.relationship("Account")
    comments = db.relationship("ForumComment", back_populates="post", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "author": self.author.username,
            "created_at": iso_utc(self.created_at),
            "comment_count": len(self.comments),
        }


class ForumComment(db.Model):
    __tablename__ = "forum_comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("forum_posts.id"), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("forum_comments.id"))
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    post = db.relationship("ForumPost", back_populates="comments")
    author = db.relationship("Account")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "post_id": self.post_id,
            "parent_id": self.parent_id,
            "content": self.content,
            "author": self.author.username,
            "created_at": iso_utc(self.created_at),
        }
