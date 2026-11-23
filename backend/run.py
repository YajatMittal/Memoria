"""Run the Memoria API for local development:  python run.py"""

import os

from memoria import create_app

app = create_app()

if __name__ == "__main__":
    # 0.0.0.0 so a phone on the same Wi-Fi network (Expo Go) can reach the API.
    app.run(host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "5001")), debug=app.config["DEBUG"])
