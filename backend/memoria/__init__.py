"""Memoria API — Flask application factory."""

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .config import Config
from .extensions import db


def create_app(overrides: dict | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)

    logging.basicConfig(level=logging.INFO)
    if app.config["SECRET_KEY"] == "dev-only-insecure-secret-key" and not (app.debug or app.testing):
        app.logger.warning("SECRET_KEY is not set — using an insecure development key.")

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"])

    from .routes import assistant, auth, forum, memories, places

    for module in (auth, memories, assistant, places, forum):
        app.register_blueprint(module.bp)

    @app.get("/")
    def health():
        return jsonify({"status": "ok", "service": "memoria-api"})

    @app.errorhandler(HTTPException)
    def http_error(exc: HTTPException):
        messages = {413: "That photo is too large (max 15 MB)."}
        return jsonify({"error": messages.get(exc.code, exc.description)}), exc.code

    @app.errorhandler(Exception)
    def unexpected_error(exc: Exception):
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Something went wrong on our side. Please try again."}), 500

    with app.app_context():
        from . import models  # noqa: F401  (register tables)

        db.create_all()

    return app
