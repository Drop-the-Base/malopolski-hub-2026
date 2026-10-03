"""Testy regresyjne dla usterek z docs/QA_REPORT_browser_test.md."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.pii_filter import anonymize_text
from app.services.testing_service import compute_sus


def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def admin_headers(ac):
    res = await ac.post("/api/v1/auth/login", json={"password": "rops-demo-2026"})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_matchmaking_gibberish_returns_no_match():
    async with client() as ac:
        res = await ac.post("/api/v1/matchmaking", json={"problem_description": "asdfgh qwerty zxcv"})
        assert res.status_code == 200
        data = res.json()
        assert data["no_match"] is True
        assert data["matches"] == []


@pytest.mark.asyncio
async def test_matchmaking_sorted_relevant_and_specific_justification():
    async with client() as ac:
        res = await ac.post("/api/v1/matchmaking", json={
            "problem_description": "Mój 82-letni dziadek w Limanowej ma trudności z wchodzeniem do wanny i potrzebuje adaptacji łazienki.",
            "powiat": "limanowski",
        })
        data = res.json()
        scores = [m["match_score"] for m in data["matches"]]
        assert scores == sorted(scores, reverse=True)
        assert data["matches"][0]["innovation_id"] == "rops-inn-002"
        assert "koMIX" not in " ".join(m["title"] for m in data["matches"])
        assert len({m["why_matched"] for m in data["matches"]}) == len(data["matches"])


@pytest.mark.asyncio
async def test_matchmaking_rejects_unknown_powiat_and_long_text():
    async with client() as ac:
        assert (await ac.post("/api/v1/matchmaking", json={"problem_description": "samotni seniorzy", "powiat": "xyz"})).status_code == 422
        assert (await ac.post("/api/v1/matchmaking", json={"problem_description": "a" * 5000})).status_code == 422


def test_pii_masks_names_and_addresses():
    clean = anonymize_text("Jan Kowalski mieszka przy ul. Długa 5 w Krakowie, tel. 600 700 800.")
    assert "Kowalski" not in clean and "Długa 5" not in clean and "600" not in clean


@pytest.mark.asyncio
async def test_admin_endpoints_require_login():
    async with client() as ac:
        assert (await ac.get("/api/v1/ideas")).status_code == 401
        assert (await ac.get("/api/v1/admin/trends")).status_code == 401
        assert (await ac.post("/api/v1/auth/login", json={"password": "zle"})).status_code == 401


@pytest.mark.asyncio
async def test_fiszka_flow_reaches_admin_and_author():
    async with client() as ac:
        payload = {
            "title": "Sąsiedzka wypożyczalnia balkoników", "summary": "Wypożyczalnia sprzętu rehabilitacyjnego w świetlicy.",
            "target_audience": "Seniorzy po urazach", "implementation_stage": "prototyp", "author_name": "Anna Test",
            "author_email": "anna@example.org", "author_type": "mieszkaniec", "powiat": "miechowski", "rodo_consent": True,
        }
        assert (await ac.post("/api/v1/ideas", json={**payload, "author_email": "not-an-email"})).status_code == 422
        assert (await ac.post("/api/v1/ideas", json={**payload, "rodo_consent": False})).status_code == 422
        res = await ac.post("/api/v1/ideas", json=payload)
        assert res.status_code == 200
        fiszka_id = res.json()["id"]
        assert "author_email" not in res.json()

        headers = await admin_headers(ac)
        queue = (await ac.get("/api/v1/admin/submissions", headers=headers)).json()
        assert any(f["id"] == fiszka_id for f in queue)
        notifs = (await ac.get("/api/v1/admin/notifications?channel=panel", headers=headers)).json()
        assert any(n["related_id"] == fiszka_id for n in notifs)

        res = await ac.patch(f"/api/v1/ideas/{fiszka_id}", headers=headers,
                             json={"status": "approved", "admin_notes": "Świetny pomysł", "assigned_mentor_id": "mentor-001"})
        assert res.status_code == 200
        status = (await ac.get(f"/api/v1/ideas/{fiszka_id}/status")).json()
        assert status["status"] == "approved" and status["admin_notes"] == "Świetny pomysł" and status["mentor_name"]


@pytest.mark.asyncio
async def test_tester_no_overbooking_or_duplicates():
    async with client() as ac:
        base = {"campaign_id": "test-camp-002", "tester_role": "opiekun", "motivation": "", "rodo_consent": True}
        first = await ac.post("/api/v1/testing/register", json={**base, "tester_name": "Ola", "tester_email": "ola@example.org"})
        assert first.status_code == 200
        dup = await ac.post("/api/v1/testing/register", json={**base, "tester_name": "Ola", "tester_email": "OLA@example.org"})
        assert dup.status_code == 409
        for i in range(10):
            await ac.post("/api/v1/testing/register", json={**base, "tester_name": f"T{i}", "tester_email": f"t{i}@example.org"})
        camps = {c["id"]: c for c in (await ac.get("/api/v1/testing/campaigns")).json()}
        assert camps["test-camp-002"]["slots_taken"] == camps["test-camp-002"]["slots_total"]
        assert camps["test-camp-002"]["status"] == "full"
        minor = await ac.post("/api/v1/testing/register", json={**base, "campaign_id": "test-camp-001", "tester_role": "mlodziez",
                                                                "tester_name": "Kuba", "tester_email": "kuba@example.org"})
        assert minor.status_code == 422


def test_sus_scoring():
    assert compute_sus([5, 1] * 5) == 100.0
    assert compute_sus([1, 5] * 5) == 0.0
    assert compute_sus([3] * 10) == 50.0


@pytest.mark.asyncio
async def test_middleman_grammar_and_unknown_id():
    async with client() as ac:
        body = {"innovation_id": "rops-inn-010", "municipality_name": "Gmina Słaboszów", "powiat": "miechowski",
                "population": 3800, "senior_percentage": 24, "annual_budget_pln": 80000, "has_cus": False}
        res = await ac.post("/api/v1/middleman/adapt", json=body)
        assert res.status_code == 200
        draft = res.json()["blueprint"]["resolution_draft"]
        assert "GMINY GMINA" not in draft and "Gminy Gmina" not in draft
        assert "Kierownikowi Gminnego Ośrodka" in draft
        assert "Cichy Kącik" in res.json()["blueprint"]["summary"]
        assert "3 800" in res.json()["blueprint"]["summary"]
        assert (await ac.post("/api/v1/middleman/adapt", json={**body, "innovation_id": "nie-istnieje"})).status_code == 404
        assert (await ac.post("/api/v1/middleman/adapt", json={**body, "senior_percentage": 250})).status_code == 422


@pytest.mark.asyncio
async def test_knowledge_search_is_diacritic_insensitive():
    async with client() as ac:
        res = await ac.get("/api/v1/knowledge/innovations", params={"search": "samotnosc"})
        assert len(res.json()) >= 1
        assert all("dQw4w9WgXcQ" not in (i.get("video_url") or "") for i in res.json())


@pytest.mark.asyncio
async def test_grant_generator_respects_call_limits():
    async with client() as ac:
        base = {"call_id": "nabor-2026-inkubator", "idea_title": "Kawiarenka", "summary": "Spotkania naprawcze seniorów i młodzieży.",
                "target_group": "seniorzy", "requested_budget_pln": 30000}
        assert (await ac.post("/api/v1/grant-applications/generate", json={**base, "requested_budget_pln": -5})).status_code == 422
        assert (await ac.post("/api/v1/grant-applications/generate", json={**base, "call_id": "nabor-2026-wiosna"})).status_code == 409
        res = await ac.post("/api/v1/grant-applications/generate", json=base)
        assert res.status_code == 200 and res.json()["missing_elements"]
