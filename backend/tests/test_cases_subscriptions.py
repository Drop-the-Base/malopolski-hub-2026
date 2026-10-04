"""G4 „Moje sprawy” (oś czasu + rozmowa autor ↔ ROPS) i G5 subskrypcje powiadomień o innowacjach i naborach."""
from datetime import date, timedelta
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

AUTHOR_EMAIL = "Autorka.Sprawy@example.org"


async def _admin_headers(ac: AsyncClient) -> dict:
    res = await ac.post("/api/v1/auth/login", json={"password": settings.ADMIN_PASSWORD})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


async def _new_fiszka(ac: AsyncClient) -> str:
    res = await ac.post("/api/v1/ideas", json={
        "title": "Sąsiedzka wypożyczalnia sprzętu rehabilitacyjnego",
        "summary": "Seniorzy po wyjściu ze szpitala czekają tygodniami na balkonik i łóżko. Chcemy wypożyczalnię w gminie.",
        "target_audience": "Seniorzy po hospitalizacji",
        "implementation_stage": "pomysl",
        "author_name": "Anna Testowa",
        "author_email": AUTHOR_EMAIL,
        "author_type": "mieszkaniec",
        "powiat": "limanowski",
        "rodo_consent": True,
    })
    assert res.status_code == 200
    return res.json()["id"]


def _step(timeline, key):
    return next(s for s in timeline if s["key"] == key)


@pytest.mark.asyncio
async def test_case_timeline_and_thread_round_trip():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _admin_headers(ac)
        fid = await _new_fiszka(ac)

        # Świeża fiszka: tylko „Wysłano” ukończone, bieżący krok – przyjęcie przez ROPS
        status = (await ac.get(f"/api/v1/ideas/{fid}/status")).json()
        assert [s["key"] for s in status["timeline"]] == ["sent", "received", "review", "decision", "reply"]
        assert _step(status["timeline"], "sent")["done"] is True
        assert _step(status["timeline"], "received")["done"] is False
        assert _step(status["timeline"], "received")["current"] is True

        # Panel ROPS widzi nową fiszkę w licznikach
        summary = (await ac.get("/api/v1/admin/inbox-summary", headers=headers)).json()
        assert fid in summary["new_submission_ids"]
        assert summary["total_attention"] >= 1

        # Rozmowa wymaga e-maila autora (wielkość liter bez znaczenia)
        denied = await ac.post(f"/api/v1/ideas/{fid}/case", json={"email": "ktos.inny@example.org"})
        assert denied.status_code == 403
        case = await ac.post(f"/api/v1/ideas/{fid}/case", json={"email": AUTHOR_EMAIL.lower()})
        assert case.status_code == 200 and case.json()["messages"] == []

        # Koordynator przyjmuje fiszkę → data na osi czasu + e-mail do autora
        ack = await ac.post(f"/api/v1/admin/submissions/{fid}/read", headers=headers)
        assert ack.status_code == 200
        status = (await ac.get(f"/api/v1/ideas/{fid}/status")).json()
        assert _step(status["timeline"], "received")["done"] is True
        assert _step(status["timeline"], "received")["date"]
        summary = (await ac.get("/api/v1/admin/inbox-summary", headers=headers)).json()
        assert fid not in summary["new_submission_ids"]

        # Autor zadaje pytanie → powiadomienie w panelu + licznik nieprzeczytanych
        asked = await ac.post(f"/api/v1/ideas/{fid}/messages", json={"email": AUTHOR_EMAIL, "body": "Czy mogę dołączyć kosztorys?"})
        assert asked.status_code == 201
        assert asked.json()["messages"][-1]["sender"] == "author"
        summary = (await ac.get("/api/v1/admin/inbox-summary", headers=headers)).json()
        assert summary["unread_by_case"].get(fid) == 1
        panel = (await ac.get("/api/v1/admin/notifications", params={"channel": "panel"}, headers=headers)).json()
        assert any(n["related_type"] == "fiszka_message" and n["related_id"] == fid for n in panel)

        # Bez e-maila autora nie da się dopisać wiadomości
        forged = await ac.post(f"/api/v1/ideas/{fid}/messages", json={"email": "obcy@example.org", "body": "Spam"})
        assert forged.status_code == 403

        # Koordynator odczytuje i odpowiada → e-mail do autora, licznik wyzerowany
        thread = (await ac.get(f"/api/v1/admin/submissions/{fid}/messages", headers=headers)).json()
        assert thread[0]["read_by_rops"] is False  # stan sprzed odczytu
        reply = await ac.post(f"/api/v1/admin/submissions/{fid}/messages", headers=headers,
                              json={"body": "Tak, prosimy o kosztorys w PDF przy kolejnej wiadomości."})
        assert reply.status_code == 201 and reply.json()[-1]["sender"] == "rops"
        summary = (await ac.get("/api/v1/admin/inbox-summary", headers=headers)).json()
        assert fid not in summary["unread_by_case"]
        outbox = (await ac.get("/api/v1/admin/notifications", params={"channel": "email"}, headers=headers)).json()
        assert any(n["subject"].startswith("Odpowiedź koordynatora ROPS") and n["related_id"] == fid for n in outbox)

        # Decyzja z mentorem i komentarzem → kroki „W ocenie”, „Decyzja”, „Odpowiedź” ukończone z datami
        mentors = (await ac.get("/api/v1/communication/mentors")).json()
        res = await ac.patch(f"/api/v1/ideas/{fid}", headers=headers, json={
            "status": "approved", "admin_notes": "Zapraszamy do pilotażu.", "assigned_mentor_id": mentors[0]["id"],
        })
        assert res.status_code == 200
        timeline = (await ac.get(f"/api/v1/ideas/{fid}/status")).json()["timeline"]
        assert all(s["done"] for s in timeline)
        assert _step(timeline, "decision")["tone"] == "positive" and _step(timeline, "decision")["date"]
        assert _step(timeline, "reply")["description"] == "Zapraszamy do pilotażu."
        assert mentors[0]["full_name"] in _step(timeline, "review")["description"]

        # Wątek widoczny dla autora
        case = (await ac.post(f"/api/v1/ideas/{fid}/case", json={"email": AUTHOR_EMAIL})).json()
        assert [m["sender"] for m in case["messages"]] == ["author", "rops"]


@pytest.mark.asyncio
async def test_admin_case_endpoints_require_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        assert (await ac.get("/api/v1/admin/inbox-summary")).status_code == 401
        assert (await ac.get("/api/v1/admin/subscriptions/stats")).status_code == 401
        assert (await ac.post("/api/v1/admin/grant-calls", json={})).status_code == 401


@pytest.mark.asyncio
async def test_problem_public_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _admin_headers(ac)
        created = await ac.post("/api/v1/problems", headers=headers, json={
            "title": "Brak transportu do lekarza", "raw_text": "Seniorzy z gminy nie mają jak dojechać do przychodni w mieście powiatowym.",
            "powiat": "gorlicki", "urgency": "standardowy",
        })
        assert created.status_code == 200
        pid = created.json()["id"]
        res = await ac.get(f"/api/v1/cases/problems/{pid}")
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "nowy" and body["timeline"][0]["done"] and body["timeline"][1]["current"]
        assert "reporter_name" not in body
        assert (await ac.get("/api/v1/cases/problems/prob-nieistnieje")).status_code == 404


@pytest.mark.asyncio
async def test_subscriptions_alerts_and_unsubscribe():
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.subscription import Subscription

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _admin_headers(ac)

        # RODO wymagane
        no_consent = await ac.post("/api/v1/subscriptions", json={"email": "a@example.org", "topics": ["nabory"], "rodo_consent": False})
        assert no_consent.status_code == 422

        seniors = await ac.post("/api/v1/subscriptions", json={
            "email": "seniorzy.alert@example.org", "topics": ["innowacje", "nabory"],
            "categories": ["seniorzy"], "powiaty": ["Gorlicki"], "rodo_consent": True,
        })
        assert seniors.status_code == 201
        assert seniors.json()["powiaty"] == ["gorlicki"] and seniors.json()["email_masked"].startswith("se***@")
        youth = await ac.post("/api/v1/subscriptions", json={
            "email": "edukacja.alert@example.org", "topics": ["innowacje"], "categories": ["edukacja"], "rodo_consent": True,
        })
        assert youth.status_code == 201
        # Ponowny zapis tego samego adresu = zmiana ustawień, nie duplikat
        again = await ac.post("/api/v1/subscriptions", json={
            "email": "Seniorzy.Alert@example.org", "topics": ["innowacje", "nabory"],
            "categories": ["seniorzy"], "powiaty": ["gorlicki"], "rodo_consent": True,
        })
        assert again.json()["is_update"] is True

        stats = (await ac.get("/api/v1/admin/subscriptions/stats", headers=headers)).json()
        assert stats["active_total"] >= 2
        assert next(c for c in stats["by_category"] if c["key"] == "seniorzy")["count"] >= 1
        assert "@" not in str(stats)

        # Nowa innowacja w kategorii „seniorzy” z powiatu gorlickiego → tylko subskrybent seniorów
        before = (await ac.get("/api/v1/admin/notifications", params={"channel": "email", "limit": 200}, headers=headers)).json()
        inn = await ac.post("/api/v1/knowledge/innovations", headers=headers, json={
            "title": "Gorlicka Taksówka Senioralna", "tagline": "Dowóz seniorów do lekarza na telefon.",
            "category": "seniorzy", "target_groups": ["seniorzy"],
            "full_description": "Gmina organizuje dowóz osób starszych do przychodni i urzędów na telefon.",
            "readiness_level": "Pilotaż", "origin_poviat": "gorlicki", "is_published": True,
        })
        assert inn.status_code == 201
        after = (await ac.get("/api/v1/admin/notifications", params={"channel": "email", "limit": 200}, headers=headers)).json()
        new_alerts = [n for n in after if n["id"] not in {b["id"] for b in before} and n["related_type"] == "subscription_alert"]
        assert [n["recipient"] for n in new_alerts] == ["seniorzy.alert@example.org"]
        assert "/powiadomienia/wypisz/" in new_alerts[0]["body"]

        # Nowy otwarty nabór dla całej Małopolski → subskrybent naborów dostaje e-mail
        today = date.today()
        created = await ac.post("/api/v1/admin/grant-calls", headers=headers, json={
            "title": "Mikrogranty sąsiedzkie 2026 (demo)", "opens_on": today.isoformat(),
            "closes_on": (today + timedelta(days=30)).isoformat(), "min_budget_pln": 1000, "max_budget_pln": 8000,
            "criteria": ["Działanie lokalne"],
        })
        assert created.status_code == 201
        body = created.json()
        assert body["call"]["is_open"] is True and body["notified_count"] == 1
        call_id = body["call"]["id"]
        assert any(c["id"] == call_id for c in (await ac.get("/api/v1/grant-calls")).json())

        # Zmiana terminu → e-mail z opisem zmian
        changed = await ac.put(f"/api/v1/admin/grant-calls/{call_id}", headers=headers, json={
            "title": "Mikrogranty sąsiedzkie 2026 (demo)", "opens_on": today.isoformat(),
            "closes_on": (today + timedelta(days=45)).isoformat(), "min_budget_pln": 1000, "max_budget_pln": 8000,
            "criteria": ["Działanie lokalne"],
        })
        assert changed.status_code == 200 and changed.json()["notified_count"] == 1
        outbox = (await ac.get("/api/v1/admin/notifications", params={"channel": "email"}, headers=headers)).json()
        assert any(n["subject"].startswith("Zmiana w naborze") and "data zamknięcia" in n["body"] for n in outbox)

        # Nabór dla innego powiatu nie trafia do subskrybenta z gorlickiego
        other = await ac.post("/api/v1/admin/grant-calls", headers=headers, json={
            "title": "Nabór tylko dla Tarnowa (demo)", "opens_on": today.isoformat(),
            "closes_on": (today + timedelta(days=10)).isoformat(), "min_budget_pln": 1000, "max_budget_pln": 5000,
            "powiat": "m. Tarnów",
        })
        assert other.json()["notified_count"] == 0

        # Walidacja dat
        bad = await ac.post("/api/v1/admin/grant-calls", headers=headers, json={
            "title": "Zły nabór", "opens_on": "2026-10-10", "closes_on": "2026-10-01", "min_budget_pln": 1, "max_budget_pln": 2,
        })
        assert bad.status_code == 422

        # Wypisanie przez token z e-maila
        async with AsyncSessionLocal() as session:
            token = (await session.execute(
                select(Subscription.token).where(Subscription.email == "seniorzy.alert@example.org")
            )).scalar_one()
        info = await ac.get(f"/api/v1/subscriptions/{token}")
        assert info.status_code == 200 and info.json()["is_active"] is True
        off = await ac.post(f"/api/v1/subscriptions/{token}/unsubscribe")
        assert off.json()["is_active"] is False
        assert (await ac.get("/api/v1/subscriptions/zly-token")).status_code == 404
