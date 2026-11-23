"""Community forum for patients, families and caregivers."""

from flask import Blueprint, g, jsonify

from ..auth import login_required
from ..extensions import db
from ..models import ForumComment, ForumPost
from ..utils import error, json_body

bp = Blueprint("forum", __name__, url_prefix="/forum")


@bp.get("/posts")
@login_required
def list_posts():
    posts = ForumPost.query.order_by(ForumPost.created_at.desc()).limit(100).all()
    return jsonify({"posts": [p.to_dict() for p in posts]})


@bp.post("/posts")
@login_required
def create_post():
    data = json_body()
    title = str(data.get("title", "")).strip()
    content = str(data.get("content", "")).strip()
    if not title or not content:
        return error("Please add a title and a message.")
    if len(title) > 200 or len(content) > 5000:
        return error("That post is too long.")

    post = ForumPost(account_id=g.account.id, title=title, content=content)
    db.session.add(post)
    db.session.commit()
    return jsonify({"post": post.to_dict()}), 201


@bp.get("/posts/<int:post_id>")
@login_required
def get_post(post_id: int):
    post = db.session.get(ForumPost, post_id)
    if post is None:
        return error("Post not found.", 404)
    comments = sorted(post.comments, key=lambda c: c.created_at)
    return jsonify({"post": post.to_dict(), "comments": [c.to_dict() for c in comments]})


@bp.post("/posts/<int:post_id>/comments")
@login_required
def add_comment(post_id: int):
    post = db.session.get(ForumPost, post_id)
    if post is None:
        return error("Post not found.", 404)

    data = json_body()
    content = str(data.get("content", "")).strip()
    if not content:
        return error("Please write a reply.")
    if len(content) > 2000:
        return error("That reply is too long.")

    parent_id = data.get("parent_id")
    if parent_id is not None:
        parent = db.session.get(ForumComment, parent_id)
        if parent is None or parent.post_id != post.id:
            return error("You can only reply to comments on this post.")

    comment = ForumComment(post_id=post.id, account_id=g.account.id, parent_id=parent_id, content=content)
    db.session.add(comment)
    db.session.commit()
    return jsonify({"comment": comment.to_dict()}), 201
