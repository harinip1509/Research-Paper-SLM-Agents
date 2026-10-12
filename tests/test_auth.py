"""Test user authentication and session management."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_auth_flow():
    # 1. Test Demo user login
    res = client.post("/api/auth/login", json={"email": "demo@scholarforge.ai", "password": "DemoScholar2025!"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == "demo@scholarforge.ai"
    token = data["token"]

    # 2. Test Get Me with token
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["name"] == "Dr. Alex Vance"

    # 3. Test Signup new user
    import uuid
    new_email = f"new_scholar_{uuid.uuid4().hex[:6]}@mit.edu"
    res_signup = client.post(
        "/api/auth/signup",
        json={
            "name": "Jane Doe",
            "email": new_email,
            "password": "SecurePassword123!",
            "institution": "MIT EECS",
        },
    )
    assert res_signup.status_code == 200
    new_token = res_signup.json()["token"]
    assert res_signup.json()["user"]["institution"] == "MIT EECS"

    # 4. Duplicate email fails
    res_dup = client.post(
        "/api/auth/signup",
        json={
            "name": "Duplicate",
            "email": new_email,
            "password": "Password123!",
        },
    )
    assert res_dup.status_code == 400

    # 5. Logout
    res_logout = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
    assert res_logout.status_code == 200

    # 6. Invalid token fails
    res_invalid = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert res_invalid.status_code == 401
