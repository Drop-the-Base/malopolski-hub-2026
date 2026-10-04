"""G8: Panel ROPS – edycja materiałów i wyzwań, eksport CSV, licznik „nowe od ostatniego logowania”."""
import csv
import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def login(ac) -> dict:
    res = await ac.post("/api/v1/auth/login", json={"password": "rops-demo-2026"})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def parse_csv(text: str):
    assert text.startswith("﻿"), "CSV powinien mieć BOM UTF-8 (polskie znaki w Excelu)"
    return list(csv.reader(io.StringIO(text.lstrip("﻿")), delimiter=";"))


@pytest.mark.asyncio
async def test_admin_content_requires_login():
    async with client() as ac:
        assert (await ac.get("/api/v1/admin/materials")).status_code == 401
        assert (await ac.get("/api/v1/admin/export/ideas.csv")).status_code == 401
        assert (await ac.get("/api/v1/admin/new-since-login")).status_code == 401
        assert (await ac.put("/api/v1/admin/challenges/1201", json={"key_social_challenge": "x" * 10})).status_code == 401
        # Radar trendów pozostaje wyłącznie dla zalogowanych
        assert (await ac.get("/api/v1/admin/trends")).status_code == 401


@pytest.mark.asyncio
async def test_materials_crud_reflects_in_public_list():
    async with client() as ac:
        h = await login(ac)
        public_before = (await ac.get("/api/v1/knowledge/materials")).json()
        assert len(public_before) >= 3  # materiały startowe w bazie

        created = await ac.post("/api/v1/admin/materials", headers=h, json={
            "title": "Poradnik: jak napisać fiszkę pomysłu",
            "category": "Metodyka",
            "description": "Krótki przewodnik krok po kroku.",
            "download_url": "/kreator-pomyslow",
            "format": "Narzędzie online",
        })
        assert created.status_code == 201, created.text
        mat = created.json()
        assert mat["id"].startswith("mat-") and mat["is_external"] is False

        public = (await ac.get("/api/v1/knowledge/materials")).json()
        assert any(m["id"] == mat["id"] for m in public)
        assert "is_published" not in public[0]  # publiczny kontrakt bez pól administracyjnych

        updated = await ac.put(f"/api/v1/admin/materials/{mat['id']}", headers=h, json={
            "title": "Poradnik fiszki (wersja 2)", "category": "Metodyka", "description": "",
            "download_url": "https://example.org/poradnik.pdf", "format": "PDF",
        })
        assert updated.status_code == 200 and updated.json()["is_external"] is True

        bad = await ac.put(f"/api/v1/admin/materials/{mat['id']}", headers=h, json={
            "title": "Zły link", "download_url": "javascript:alert(1)",
        })
        assert bad.status_code == 422

        assert (await ac.delete(f"/api/v1/admin/materials/{mat['id']}", headers=h)).status_code == 200
        public_after = (await ac.get("/api/v1/knowledge/materials")).json()
        assert all(m["id"] != mat["id"] for m in public_after)
        admin_list = (await ac.get("/api/v1/admin/materials", headers=h)).json()
        assert any(m["id"] == mat["id"] and m["is_published"] is False for m in admin_list)


@pytest.mark.asyncio
async def test_update_powiat_challenge():
    async with client() as ac:
        h = await login(ac)
        challenges = (await ac.get("/api/v1/knowledge/challenges")).json()
        code = challenges[0]["powiat_code"]
        res = await ac.put(f"/api/v1/admin/challenges/{code}", headers=h,
                           json={"key_social_challenge": "Brak mieszkań wspomaganych dla seniorów"})
        assert res.status_code == 200
        assert res.json()["key_social_challenge"] == "Brak mieszkań wspomaganych dla seniorów"
        refreshed = (await ac.get("/api/v1/knowledge/challenges")).json()
        assert next(c for c in refreshed if c["powiat_code"] == code)["key_social_challenge"].startswith("Brak mieszkań")
        assert (await ac.put("/api/v1/admin/challenges/0000", headers=h,
                             json={"key_social_challenge": "Coś ważnego"})).status_code == 404


@pytest.mark.asyncio
async def test_csv_exports_without_contact_data():
    async with client() as ac:
        await ac.post("/api/v1/ideas", json={
            "title": "Klub sąsiedzki dla seniorów", "summary": "Spotkania raz w tygodniu w świetlicy wiejskiej.",
            "target_audience": "seniorzy", "implementation_stage": "pomysl", "author_name": "Ewa Testowa",
            "author_email": "ewa.testowa@example.org", "author_type": "mieszkaniec", "powiat": "tarnowski",
            "rodo_consent": True,
        })
        h = await login(ac)
        ideas = await ac.get("/api/v1/admin/export/ideas.csv", headers=h)
        assert ideas.status_code == 200
        assert ideas.headers["content-type"].startswith("text/csv")
        assert "attachment" in ideas.headers["content-disposition"]
        rows = parse_csv(ideas.text)
        assert rows[0][0] == "id" and len(rows) > 1
        assert "ewa.testowa@example.org" not in ideas.text and "Ewa Testowa" not in ideas.text

        problems = parse_csv((await ac.get("/api/v1/admin/export/problems.csv", headers=h)).text)
        assert "zrodlo" in problems[0]
        needs = parse_csv((await ac.get("/api/v1/admin/export/needs.csv", headers=h)).text)
        assert needs[0][:4] == ["powiat", "obszar", "obszar_nazwa", "zgloszenia_razem"]
        assert (await ac.get("/api/v1/admin/export/users.csv", headers=h)).status_code == 422


@pytest.mark.asyncio
async def test_new_since_last_login_counter():
    async with client() as ac:
        await login(ac)  # ustala czas „poprzedniego logowania”
        h = await login(ac)
        before = (await ac.get("/api/v1/admin/new-since-login", headers=h)).json()
        assert before["first_login"] is False
        assert before["new_ideas"] == 0

        await ac.post("/api/v1/ideas", json={
            "title": "Wypożyczalnia sprzętu rehabilitacyjnego", "summary": "Gminna wypożyczalnia balkoników i wózków.",
            "target_audience": "seniorzy", "implementation_stage": "pomysl", "author_name": "Jan Test",
            "author_email": "jan.test@example.org", "author_type": "mieszkaniec", "powiat": "suski",
            "rodo_consent": True,
        })
        await ac.post("/api/v1/matchmaking", json={"problem_description": "Samotni seniorzy na wsi bez dojazdu."})
        after = (await ac.get("/api/v1/admin/new-since-login", headers=h)).json()
        assert after["new_ideas"] == 1
        assert after["new_matchmaking_queries"] >= 1
        assert after["total"] >= 2
