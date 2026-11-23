from conftest import jpeg_bytes, register


def upload(client, headers, day="2025-02-18"):
    return client.post(
        "/memories",
        data={"image": (jpeg_bytes(), "photo.jpg"), "captured_on": day},
        headers=headers,
        content_type="multipart/form-data",
    )


def test_upload_caption_list_delete(client, auth):
    res = upload(client, auth)
    assert res.status_code == 201
    memory = res.get_json()["memory"]
    assert memory["caption"] == "A dog playing in a park"
    assert memory["captured_on"] == "2025-02-18"

    res = client.get("/memories?date=2025-02-18", headers=auth)
    assert [m["id"] for m in res.get_json()["memories"]] == [memory["id"]]

    res = client.get("/memories/days", headers=auth)
    assert res.get_json()["days"] == {"2025-02-18": 1}

    # Empty day returns an empty list, not an error.
    assert client.get("/memories?date=2025-02-19", headers=auth).get_json()["memories"] == []

    assert client.delete(f"/memories/{memory['id']}", headers=auth).status_code == 204
    assert client.get("/memories?date=2025-02-18", headers=auth).get_json()["memories"] == []


def test_users_cannot_see_or_delete_each_others_memories(client, auth, sent_codes):
    memory_id = upload(client, auth).get_json()["memory"]["id"]
    other = register(client, sent_codes, email="eve@example.com", username="eve")

    assert client.get("/memories?date=2025-02-18", headers=other).get_json()["memories"] == []
    assert client.delete(f"/memories/{memory_id}", headers=other).status_code == 404
    assert len(client.get("/memories?date=2025-02-18", headers=auth).get_json()["memories"]) == 1


def test_rejects_non_images(client, auth):
    res = client.post(
        "/memories",
        data={"image": (__import__("io").BytesIO(b"not an image"), "x.jpg")},
        headers=auth,
        content_type="multipart/form-data",
    )
    assert res.status_code == 400
