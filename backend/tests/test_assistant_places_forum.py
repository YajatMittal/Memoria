from test_memories import upload

from memoria.services import gemini


def test_assistant_recalls_a_day_from_photos(client, auth, monkeypatch):
    upload(client, auth, day="2025-02-17")
    monkeypatch.setattr(gemini, "generate_json", lambda prompt, schema: {"asks_about_past_day": True, "date": "2025-02-17"})
    seen = {}

    def fake_text(prompt, system=None, history=None):
        seen["prompt"] = prompt
        return "You spent time at the park with a dog."

    monkeypatch.setattr(gemini, "generate_text", fake_text)

    res = client.post("/assistant/chat", json={"message": "What did I do yesterday?", "today": "2025-02-18"}, headers=auth)
    body = res.get_json()
    assert res.status_code == 200
    assert body["date"] == "2025-02-17"
    assert len(body["memories"]) == 1
    assert "A dog playing in a park" in seen["prompt"]


def test_assistant_day_without_photos_skips_llm_summary(client, auth, monkeypatch):
    monkeypatch.setattr(gemini, "generate_json", lambda prompt, schema: {"asks_about_past_day": True, "date": "2025-01-01"})
    monkeypatch.setattr(gemini, "generate_text", lambda *a, **k: (_ for _ in ()).throw(AssertionError("unexpected")))
    res = client.post("/assistant/chat", json={"message": "New year's day?", "today": "2025-02-18"}, headers=auth)
    assert res.status_code == 200
    assert "couldn't find any photos" in res.get_json()["reply"]


def test_assistant_general_chat_and_outage(client, auth, monkeypatch):
    monkeypatch.setattr(gemini, "generate_json", lambda prompt, schema: {"asks_about_past_day": False})
    monkeypatch.setattr(gemini, "generate_text", lambda prompt, system=None, history=None: f"echo:{prompt}:{len(history)}")
    res = client.post(
        "/assistant/chat",
        json={"message": "Hello", "history": [{"role": "user", "text": "hi"}, {"role": "assistant", "text": "hey"}]},
        headers=auth,
    )
    assert res.get_json()["reply"] == "echo:Hello:2"

    def down(*a, **k):
        raise gemini.GeminiUnavailable("quota")

    monkeypatch.setattr(gemini, "generate_json", down)
    assert client.post("/assistant/chat", json={"message": "Hello"}, headers=auth).status_code == 503


def test_place_visit_is_new_only_once(client, auth, monkeypatch):
    monkeypatch.setattr(
        "memoria.routes.places.reverse_geocode", lambda lat, lon: {"name": "Central Library", "address": "Toronto, Canada"}
    )
    first = client.post("/places/visit", json={"latitude": 43.65, "longitude": -79.38}, headers=auth).get_json()
    second = client.post("/places/visit", json={"latitude": 43.65, "longitude": -79.38}, headers=auth).get_json()
    assert first["is_new"] is True and second["is_new"] is False
    assert first["place"]["name"] == "Central Library"
    assert client.post("/places/visit", json={"latitude": "x"}, headers=auth).status_code == 400


def test_forum_posts_and_comments(client, auth):
    res = client.post("/forum/posts", json={"title": "Tips for caregivers", "content": "What helps you?"}, headers=auth)
    assert res.status_code == 201
    post_id = res.get_json()["post"]["id"]

    res = client.post(f"/forum/posts/{post_id}/comments", json={"content": "Routines help a lot."}, headers=auth)
    assert res.status_code == 201

    posts = client.get("/forum/posts", headers=auth).get_json()["posts"]
    assert posts[0]["author"] == "ada" and posts[0]["comment_count"] == 1

    detail = client.get(f"/forum/posts/{post_id}", headers=auth).get_json()
    assert detail["comments"][0]["content"] == "Routines help a lot."
    assert client.post("/forum/posts", json={"title": "", "content": "x"}, headers=auth).status_code == 400
