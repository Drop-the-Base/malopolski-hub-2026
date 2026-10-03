import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_canvas_evaluation_and_grant():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        canvas_payload = {
            "problem": "Brak integracji młodzieży z seniorami w osiedlu mieszkaniowym.",
            "target_group": "Seniorzy 65+ oraz młodzież licealna w wieku 15-18 lat.",
            "value_proposition": "Cykl warsztatów kulinarno-komiksowych łączących pokolenia.",
            "barriers": "Wstyd młodzieży i obawa seniorów przed hałasem.",
            "resources": "Lokalna świetlica parafialna i biblioteka.",
            "partners": "Liceum Ogólnokształcące nr 1, Koło Gospodyń.",
            "testing_plan": "Pilotaż z 10 seniorami i 10 uczniami.",
            "metrics": "Liczba 20 uczestników, wzrost poczucia przynależności o 30%.",
            "scalability": "Wdrożenie w 5 kolejnych osiedlach."
        }
        res = await ac.post("/api/v1/canvas/evaluate", json=canvas_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall_score"] >= 70
        assert "visual_concept_prompt" in data
        assert len(data["strengths"]) > 0

@pytest.mark.asyncio
async def test_canvas_autofill():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "prompt": "Kawiarenka naprawcza dla seniorów i młodzieży",
            "powiat": "Nowy Sącz"
        }
        res = await ac.post("/api/v1/canvas/autofill", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "idea_title" in data
        assert "problem" in data
        assert "value_proposition" in data
        assert "partners" in data
        assert len(data["problem"]) > 10
        assert "ai_powered" in data
        assert "latency_ms" in data
