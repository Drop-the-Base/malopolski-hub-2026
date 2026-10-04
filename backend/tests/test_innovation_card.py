"""Karta innowacji: historia problem → rozwiązanie → efekt oraz ocena 1–5 z propozycją usprawnienia (G6, G7)."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_innovation_card_has_story_fields():
    async with client() as ac:
        res = await ac.get("/api/v1/knowledge/innovations/rops-inn-001")
        assert res.status_code == 200
        data = res.json()
        assert data["problem_statement"]
        assert data["effect_description"]


@pytest.mark.asyncio
async def test_rate_innovation_updates_summary_and_notifies_admin():
    async with client() as ac:
        empty = (await ac.get("/api/v1/testing/innovations/rops-inn-004/rating")).json()
        assert empty["ratings_count"] == 0 and empty["average_rating"] is None

        res = await ac.post("/api/v1/testing/innovations/rops-inn-004/rating", json={"rating": 5})
        assert res.status_code == 201
        res = await ac.post("/api/v1/testing/innovations/rops-inn-004/rating", json={
            "rating": 4,
            "improvement_proposal": "  Dodać numer telefonu do zamówienia wizyty dla osób bez internetu.  ",
            "author_role": "senior",
        })
        assert res.status_code == 201
        body = res.json()
        assert "koordynatora" in body["message"]
        assert body["summary"] == {"innovation_id": "rops-inn-004", "ratings_count": 2, "average_rating": 4.5, "proposals_count": 1}

        summaries = (await ac.get("/api/v1/testing/ratings")).json()
        assert any(s["innovation_id"] == "rops-inn-004" and s["ratings_count"] == 2 for s in summaries)

        login = await ac.post("/api/v1/auth/login", json={"password": "rops-demo-2026"})
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        notifications = (await ac.get("/api/v1/admin/notifications", headers=headers)).json()
        assert any("Propozycja usprawnienia" in n["subject"] for n in notifications)


@pytest.mark.asyncio
async def test_rate_innovation_validation():
    async with client() as ac:
        assert (await ac.post("/api/v1/testing/innovations/rops-inn-001/rating", json={"rating": 6})).status_code == 422
        assert (await ac.post("/api/v1/testing/innovations/rops-inn-001/rating", json={"rating": 0})).status_code == 422
        assert (await ac.post("/api/v1/testing/innovations/rops-inn-001/rating",
                              json={"rating": 3, "improvement_proposal": "x" * 1001})).status_code == 422
        assert (await ac.post("/api/v1/testing/innovations/nie-ma/rating", json={"rating": 3})).status_code == 404
