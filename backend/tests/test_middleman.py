import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_middleman_adaptation_and_etr():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Test adaptacji usługi dla gminy
        adapt_payload = {
            "innovation_id": "rops-inn-001",
            "municipality_name": "Gmina Słaboszów",
            "powiat": "miechowski",
            "population": 3800,
            "senior_percentage": 28.5,
            "annual_budget_pln": 90000,
            "has_cus": False
        }
        res = await ac.post("/api/v1/middleman/adapt", json=adapt_payload)
        assert res.status_code == 200
        blueprint = res.json()["blueprint"]
        assert "PROJEKT UCHWAŁY" in blueprint["resolution_draft"]
        assert "Słaboszów" in blueprint["resolution_draft"]
        assert len(blueprint["operational_steps"]) >= 4

        # 2. Test transformacji tekstu do standardu ETR
        etr_payload = {
            "source_text": "Konieczna jest deinstytucjonalizacja usług opiekuńczych na rzecz seniorów oraz likwidacja barier architektonicznych."
        }
        etr_res = await ac.post("/api/v1/tools/etr-simplify", json=etr_payload)
        assert etr_res.status_code == 200
        etr_data = etr_res.json()
        assert "pomoc chorym w ich własnym domu" in etr_data["simple_text"]
        assert len(etr_data["key_points"]) > 0
