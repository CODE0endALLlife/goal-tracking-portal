def test_register_and_login(client):
    # Register
    res = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
        "first_name": "John",
        "last_name": "Doe"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "test@example.com"

    # Login
    res = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    assert res.status_code == 200
    tokens = res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens


def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrong"
    })
    assert res.status_code == 401
