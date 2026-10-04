"""G15 panel eksperta/mentora i G16 porównanie innowacji (Teczka wdrożeń dla JST)."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

AUTHOR_EMAIL = "autor.mentoringu@example.org"


async def _admin_headers(ac: AsyncClient) -> dict:
    res = await ac.post("/api/v1/auth/login", json={"password": settings.ADMIN_PASSWORD})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


async def _mentor_headers(ac: AsyncClient, mentor_id: str = "mentor-002") -> dict:
    res = await ac.post("/api/v1/auth/mentor-login", json={"mentor_id": mentor_id, "access_code": settings.MENTOR_PASSWORD})
    assert res.status_code == 200, res.text
    assert res.json()["mentor"]["id"] == mentor_id
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


async def _assigned_fiszka(ac: AsyncClient, admin: dict, mentor_id: str) -> str:
    res = await ac.post("/api/v1/ideas", json={
        "title": "Dostępny punkt obsługi w urzędzie gminy",
        "summary": "Osoby z niepełnosprawnościami nie mogą załatwić sprawy w urzędzie. Chcemy przygotować punkt obsługi z pętlą indukcyjną.",
        "target_audience": "Osoby z niepełnosprawnościami",
        "implementation_stage": "pomysl",
        "author_name": "Ewa Mentorowana",
        "author_email": AUTHOR_EMAIL,
        "author_type": "mieszkaniec",
        "powiat": "miechowski",
        "rodo_consent": True,
    })
    assert res.status_code == 200
    fid = res.json()["id"]
    res = await ac.patch(f"/api/v1/ideas/{fid}", headers=admin, json={"status": "in_review", "assigned_mentor_id": mentor_id})
    assert res.status_code == 200
    return fid


@pytest.mark.asyncio
async def test_mentor_login_and_role_separation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        bad = await ac.post("/api/v1/auth/mentor-login", json={"mentor_id": "mentor-001", "access_code": "zle-haslo"})
        assert bad.status_code == 401
        unknown = await ac.post("/api/v1/auth/mentor-login", json={"mentor_id": "nie-ma", "access_code": settings.MENTOR_PASSWORD})
        assert unknown.status_code == 401
        assert (await ac.get("/api/v1/mentor/me")).status_code == 401

        mentor = await _mentor_headers(ac)
        # Token mentora nie otwiera Panelu ROPS, a token koordynatora nie otwiera panelu mentora
        assert (await ac.get("/api/v1/admin/submissions", headers=mentor)).status_code == 401
        assert (await ac.get("/api/v1/admin/mentor-activity", headers=mentor)).status_code == 401
        admin = await _admin_headers(ac)
        assert (await ac.get("/api/v1/mentor/me", headers=admin)).status_code == 401


@pytest.mark.asyncio
async def test_mentor_dashboard_demo_data():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        me = (await ac.get("/api/v1/mentor/me", headers=await _mentor_headers(ac, "mentor-001"))).json()
        assert any(f["id"] == "fiszka-sen-01" for f in me["fiszki"])
        assert all("author_email" not in f for f in me["fiszki"])
        # Pytania w obszarze mentora: konsultacje mentorskie zawsze, pozostałe po słowach ze specjalizacji
        ids = {t["id"] for t in me["threads"]}
        assert "thread-002" in ids  # konsultacja_mentorska
        assert "thread-003" in ids  # opieka wytchnieniowa dla seniorów
        assert me["stats"]["assigned_fiszki"] == len(me["fiszki"])


@pytest.mark.asyncio
async def test_mentor_feedback_reaches_author_and_admin():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await _admin_headers(ac)
        fid = await _assigned_fiszka(ac, admin, "mentor-002")
        mentor = await _mentor_headers(ac, "mentor-002")

        me = (await ac.get("/api/v1/mentor/me", headers=mentor)).json()
        item = next(f for f in me["fiszki"] if f["id"] == fid)
        assert item["my_feedback_count"] == 0

        short = await ac.post(f"/api/v1/mentor/fiszki/{fid}/feedback", headers=mentor, json={"body": "ok"})
        assert short.status_code == 422
        body = "Mocne strony: jasny problem i grupa odbiorców. Do doprecyzowania: kto obsługuje pętlę indukcyjną."
        res = await ac.post(f"/api/v1/mentor/fiszki/{fid}/feedback", headers=mentor, json={"body": body})
        assert res.status_code == 201
        assert res.json()["my_feedback_count"] == 1

        # Inny mentor nie może wysłać opinii do nieprzydzielonej fiszki
        other = await _mentor_headers(ac, "mentor-003")
        denied = await ac.post(f"/api/v1/mentor/fiszki/{fid}/feedback", headers=other, json={"body": body})
        assert denied.status_code == 403

        # Autor widzi opinię z podpisem mentora w „Moich sprawach”
        case = (await ac.post(f"/api/v1/ideas/{fid}/case", json={"email": AUTHOR_EMAIL})).json()
        msg = case["messages"][-1]
        assert msg["sender"] == "mentor"
        assert msg["sender_name"] == "mgr inż. arch. Michał Zieliński"
        assert msg["sender_role"].startswith("Mentor ROPS")
        review = next(s for s in case["status"]["timeline"] if s["key"] == "review")
        assert "opinię" in review["description"]

        # E-mail do autora w skrzynce nadawczej + powiadomienie w panelu ROPS
        outbox = (await ac.get("/api/v1/admin/notifications", params={"channel": "email"}, headers=admin)).json()
        assert any(n["recipient"] == AUTHOR_EMAIL and "Opinia mentora" in n["subject"] for n in outbox)
        panel = (await ac.get("/api/v1/admin/notifications", params={"channel": "panel"}, headers=admin)).json()
        assert any(n["related_type"] == "mentor_feedback" and n["related_id"] == fid for n in panel)

        # Koordynator widzi aktywność mentora
        activity = (await ac.get("/api/v1/admin/mentor-activity", headers=admin)).json()
        row = next(m for m in activity["mentors"] if m["mentor_id"] == "mentor-002")
        assert row["feedback_sent"] >= 1 and row["assigned_fiszki"] >= 1
        assert activity["total_feedback"] >= 1


@pytest.mark.asyncio
async def test_mentor_thread_reply_signed():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        mentor = await _mentor_headers(ac, "mentor-002")
        res = await ac.post("/api/v1/mentor/threads/thread-002/reply", headers=mentor,
                            json={"body": "Proszę zacząć od audytu wejścia i strony internetowej – to tanie i szybkie."})
        assert res.status_code == 201
        data = res.json()
        assert data["answered_by_me"] is True and data["needs_answer"] is False
        assert data["messages"][-1]["sender_role"] == "mentor"
        assert data["messages"][-1]["sender_name"] == "mgr inż. arch. Michał Zieliński"
        missing = await ac.post("/api/v1/mentor/threads/nie-ma/reply", headers=mentor, json={"body": "Odpowiedź testowa ok."})
        assert missing.status_code == 404
        me = (await ac.get("/api/v1/mentor/me", headers=mentor)).json()
        assert me["stats"]["thread_replies"] >= 1


@pytest.mark.asyncio
async def test_compare_innovations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/knowledge/compare", params={"ids": "rops-inn-001,rops-inn-010,nie-istnieje"})
        assert res.status_code == 200
        data = res.json()
        assert [i["id"] for i in data["items"]] == ["rops-inn-001", "rops-inn-010"]
        assert data["missing_ids"] == ["nie-istnieje"]
        first = data["items"][0]
        assert first["setup_cost_pln"] == 45000 and first["monthly_cost_pln"] == 5400
        assert first["staff_needs"] and first["readiness_level"] and first["problem_statement"]
        assert "Middleman" in data["cost_basis"]

        too_many = await ac.get("/api/v1/knowledge/compare", params={"ids": "a,b,c,d"})
        assert too_many.status_code == 422
        empty = await ac.get("/api/v1/knowledge/compare", params={"ids": " , "})
        assert empty.status_code == 422
