from conftest import register


def test_signup_verify_login_flow(client, sent_codes):
    res = client.post("/auth/signup", json={"email": "Ada@Example.com", "username": "ada", "password": "correct horse"})
    assert res.status_code == 201
    account_id = res.get_json()["account_id"]

    # Can't log in before verifying.
    res = client.post("/auth/login", json={"email": "ada@example.com", "password": "correct horse"})
    assert res.status_code == 403
    assert res.get_json()["account_id"] == account_id

    res = client.post("/auth/verify", json={"account_id": account_id, "code": sent_codes["ada@example.com"]})
    assert res.status_code == 200
    assert res.get_json()["user"]["username"] == "ada"

    res = client.post("/auth/login", json={"email": "ada@example.com", "password": "correct horse"})
    assert res.status_code == 200
    token = res.get_json()["token"]

    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.get_json()["user"]["email"] == "ada@example.com"


def test_wrong_password_and_unknown_email_look_the_same(client, auth):
    wrong = client.post("/auth/login", json={"email": "ada@example.com", "password": "nope nope"})
    unknown = client.post("/auth/login", json={"email": "who@example.com", "password": "nope nope"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.get_json() == unknown.get_json()


def test_duplicate_verified_email_rejected(client, auth):
    res = client.post("/auth/signup", json={"email": "ada@example.com", "username": "ada2", "password": "12345678"})
    assert res.status_code == 409


def test_signup_validation(client):
    assert client.post("/auth/signup", json={"email": "bad", "username": "ada", "password": "12345678"}).status_code == 400
    assert client.post("/auth/signup", json={"email": "a@b.co", "username": "a", "password": "12345678"}).status_code == 400
    assert client.post("/auth/signup", json={"email": "a@b.co", "username": "ada", "password": "short"}).status_code == 400


def test_verification_locks_after_too_many_attempts(client, sent_codes):
    res = client.post("/auth/signup", json={"email": "bob@example.com", "username": "bob", "password": "12345678"})
    account_id = res.get_json()["account_id"]
    real = sent_codes["bob@example.com"]
    wrong = "000000" if real != "000000" else "111111"
    for _ in range(5):
        assert client.post("/auth/verify", json={"account_id": account_id, "code": wrong}).status_code == 401
    # Even the right code no longer works; a new one must be requested.
    assert client.post("/auth/verify", json={"account_id": account_id, "code": real}).status_code == 410
    assert client.post("/auth/resend", json={"account_id": account_id}).status_code == 200
    res = client.post("/auth/verify", json={"account_id": account_id, "code": sent_codes["bob@example.com"]})
    assert res.status_code == 200


def test_protected_routes_require_token(client):
    assert client.get("/memories?date=2025-01-01").status_code == 401
    assert client.get("/memories?date=2025-01-01", headers={"Authorization": "Bearer forged"}).status_code == 401
