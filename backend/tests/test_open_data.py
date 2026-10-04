"""G9: otwarte API (JSON/CSV, stronicowanie, CORS) i webhook wychodzący."""
import json
import pytest
from httpx import AsyncClient, ASGITransport
from app.core.config import settings
from app.main import app
from app.services import webhook_service


def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_open_innovations_paginated_json():
    async with client() as ac:
        res = await ac.get("/api/v1/open/innovations", params={"page": 1, "page_size": 3})
        assert res.status_code == 200
        data = res.json()
        assert data["page"] == 1 and data["page_size"] == 3
        assert data["total"] >= 10 and data["pages"] == -(-data["total"] // 3)
        assert len(data["items"]) == 3
        assert data["next"] == "/api/v1/open/innovations?page=2&page_size=3"
        assert data["previous"] is None
        item = data["items"][0]
        assert {"id", "title", "category", "target_groups", "page_path"} <= set(item)

        last = (await ac.get("/api/v1/open/innovations", params={"page": data["pages"], "page_size": 3})).json()
        assert last["next"] is None and last["previous"]

        filtered = (await ac.get("/api/v1/open/innovations", params={"category": "dostepnosc"})).json()
        assert filtered["items"] and all(i["category"] == "dostepnosc" for i in filtered["items"])
        assert (await ac.get("/api/v1/open/innovations", params={"category": "nieznana"})).status_code == 422
        assert (await ac.get("/api/v1/open/innovations", params={"page_size": 500})).status_code == 422


@pytest.mark.asyncio
async def test_open_csv_and_other_resources():
    async with client() as ac:
        csv_res = await ac.get("/api/v1/open/innovations.csv")
        assert csv_res.status_code == 200
        assert csv_res.headers["content-type"].startswith("text/csv")
        assert csv_res.text.startswith("﻿id;tytul;")

        challenges = (await ac.get("/api/v1/open/challenges")).json()
        assert challenges["total"] == 22
        assert (await ac.get("/api/v1/open/challenges.csv")).status_code == 200

        needs = (await ac.get("/api/v1/open/needs")).json()
        assert needs["items"]
        assert set(needs["items"][0]) >= {"powiat", "category", "reports_total"}
        # Agregaty: bez treści zgłoszeń i danych zgłaszających
        assert "reporter_name" not in json.dumps(needs) and "clean_text" not in json.dumps(needs)

        index = (await ac.get("/api/v1/open")).json()
        assert "innovations" in index["resources"]


@pytest.mark.asyncio
async def test_open_api_cors_for_any_origin_but_not_private_api():
    async with client() as ac:
        origin = {"Origin": "https://dane.example.gov.pl"}
        res = await ac.get("/api/v1/open/innovations", headers=origin)
        assert res.headers["access-control-allow-origin"] == "*"
        assert "access-control-allow-credentials" not in res.headers

        preflight = await ac.options("/api/v1/open/innovations.csv", headers={
            **origin, "Access-Control-Request-Method": "GET"})
        assert preflight.status_code == 204
        assert preflight.headers["access-control-allow-origin"] == "*"

        # Pozostałe API nie dostaje CORS dla obcych domen
        private = await ac.get("/api/v1/knowledge/innovations", headers=origin)
        assert private.headers.get("access-control-allow-origin") is None


IDEA = {
    "title": "Mobilna biblioteka dla seniorów", "summary": "Książki dowożone raz w tygodniu do sołectw bez biblioteki.",
    "target_audience": "seniorzy", "implementation_stage": "pomysl", "author_name": "Anna Webhook",
    "author_email": "anna.webhook@example.org", "author_type": "mieszkaniec", "powiat": "bocheński",
    "rodo_consent": True,
}


@pytest.mark.asyncio
async def test_webhook_fired_on_new_fiszka_without_pii(monkeypatch):
    sent = []

    async def fake_post(url, body, headers):
        sent.append((url, json.loads(body), headers))
        return 200

    monkeypatch.setattr(settings, "WEBHOOK_URL", "https://hooks.example.org/mhis")
    monkeypatch.setattr(settings, "WEBHOOK_SECRET", "sekret")
    monkeypatch.setattr(webhook_service, "_post", fake_post)
    async with client() as ac:
        res = await ac.post("/api/v1/ideas", json=IDEA)
        assert res.status_code == 200
        await webhook_service.drain()

    assert len(sent) == 1
    url, payload, headers = sent[0]
    assert url == "https://hooks.example.org/mhis"
    assert payload["event"] == "fiszka.created"
    assert payload["data"]["id"] == res.json()["id"]
    assert headers["X-MHIS-Event"] == "fiszka.created"
    assert headers["X-MHIS-Signature"].startswith("sha256=")
    raw = json.dumps(payload, ensure_ascii=False)
    assert "anna.webhook@example.org" not in raw and "Anna Webhook" not in raw


@pytest.mark.asyncio
async def test_webhook_on_problem_report_and_failure_is_non_blocking(monkeypatch):
    calls = []

    async def failing_post(url, body, headers):
        calls.append(json.loads(body)["event"])
        raise ConnectionError("odbiorca niedostępny")

    monkeypatch.setattr(settings, "WEBHOOK_URL", "https://hooks.example.org/down")
    monkeypatch.setattr(webhook_service, "_post", failing_post)
    async with client() as ac:
        login = await ac.post("/api/v1/auth/login", json={"password": "rops-demo-2026"})
        h = {"Authorization": f"Bearer {login.json()['access_token']}"}
        res = await ac.post("/api/v1/problems", headers=h, json={
            "title": "Brak transportu do przychodni", "raw_text": "Seniorzy z sołectw nie mają jak dojechać do lekarza.",
            "powiat": "gorlicki", "reporter_name": "Urzędnik Testowy", "urgency": "standardowy",
        })
        assert res.status_code == 200  # błąd webhooka nie psuje zgłoszenia
        await webhook_service.drain()
    assert calls == ["problem_report.created"]


@pytest.mark.asyncio
async def test_webhook_disabled_without_url(monkeypatch):
    monkeypatch.setattr(settings, "WEBHOOK_URL", "")
    assert webhook_service.fire_event("fiszka.created", {"id": "x"}) is False
