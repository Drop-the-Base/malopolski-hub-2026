import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_matchmaking_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "problem_description": "Osoby starsze w naszej wsi w powiecie gorlickim nie mają transportu do lekarza i czują się samotne. Mój PESEL to 12345678901.",
            "powiat": "gorlicki",
            "limit": 3
        }
        response = await ac.post("/api/v1/matchmaking", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["matches"]) > 0
        assert "clean_query" in data
        # Weryfikacja usunięcia PESEL
        assert "12345678901" not in data["clean_query"]
        assert "[ZANONIMIZOWANY PESEL]" in data["clean_query"]
        # Weryfikacja pierwszego wyniku
        first_match = data["matches"][0]
        assert "innovation_id" in first_match
        assert "why_matched" in first_match
        assert first_match["match_score"] > 0.5
        # Weryfikacja syntezy Ceneo
        assert "ceneo_intro" in data
        assert len(data["ceneo_intro"]) > 10
        assert "ceneo_bundle_rationale" in data
        assert "action_steps" in data
        assert len(data["action_steps"]) >= 2

