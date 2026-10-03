import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_problems_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Pobranie listy problemów
        res = await ac.get("/api/v1/problems")
        assert res.status_code == 200
        initial_list = res.json()
        assert isinstance(initial_list, list)

        # 2. Utworzenie nowego zgłoszenia wyzwania z PESEL
        create_payload = {
            "title": "Brak opieki wytchnieniowej dla 40 opiekunów",
            "raw_text": "Opiekunowie osób z demencją w Limanowej są wyczerpani. PESEL: 85010112345, kontakt Jan Kowalski.",
            "category": "uslugi_opiekuncze",
            "powiat": "limanowski",
            "gmina": "Limanowa",
            "reporter_type": "urzednik_jst",
            "reporter_name": "Anna Urzędnik",
            "reporter_role": "Kierownik GOPS",
            "urgency": "krytyczny",
            "affected_count": 40
        }
        res_create = await ac.post("/api/v1/problems", json=create_payload)
        assert res_create.status_code == 200
        problem_data = res_create.json()
        problem_id = problem_data["id"]

        assert problem_data["title"] == create_payload["title"]
        assert problem_data["urgency"] == "krytyczny"
        assert problem_data["affected_count"] == 40
        # Weryfikacja Zero-PII
        assert "85010112345" not in problem_data["clean_text"]
        assert "[ZANONIMIZOWANY PESEL]" in problem_data["clean_text"]

        # 3. Przypisanie innowacji ROPS
        res_assign = await ac.post(
            f"/api/v1/problems/{problem_id}/assign-innovation",
            json={"innovation_id": "rops-inn-001", "notes": "Zatwierdzone do pilotażu."}
        )
        assert res_assign.status_code == 200
        assigned_data = res_assign.json()
        assert assigned_data["assigned_innovation_id"] == "rops-inn-001"
        assert assigned_data["status"] == "przypisana_innowacja"

        # 4. Aktualizacja zgłoszenia (PATCH)
        res_patch = await ac.patch(
            f"/api/v1/problems/{problem_id}",
            json={"status": "wdrazany"}
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "wdrazany"

        # 5. Podsumowanie regionalne
        res_summary = await ac.get("/api/v1/problems/summary/regional?powiat=limanowski")
        assert res_summary.status_code == 200
        summary_data = res_summary.json()
        assert summary_data["powiat"] == "limanowski"
        assert summary_data["total_challenges"] >= 1
        assert "top_categories" in summary_data
