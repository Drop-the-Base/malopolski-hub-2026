"""G3: widoczna trafność Matchmakingu – słowa kluczowe, podświetlenia i podobne zgłoszenia z regionu."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.matchmaking_service import detect_concepts, detect_concepts_with_evidence


def test_evidence_points_to_words_in_text():
    text = "Samotni seniorzy na wsi nie mają dojazdu do lekarza."
    evidence = detect_concepts_with_evidence(text)
    words = {k: [text[a:b] for a, b in spans] for k, spans in evidence.items()}
    assert words["samotnosc"] == ["Samotni"]
    assert words["seniorzy"] == ["seniorzy"]
    assert words["wies"] == ["wsi"]
    assert "dojazdu" in words["transport"]


def test_children_of_seniors_are_not_youth_need():
    # "dzieci wyjechały" w opisie problemu seniorów nie powinno kierować do innowacji dla młodzieży
    assert "mlodziez" not in detect_concepts("Starsi ludzie są samotni, dzieci wyjechały za granicę.")
    assert "mlodziez" in detect_concepts("Dzieci w szkole mają problemy z koncentracją.")


@pytest.mark.asyncio
async def test_matchmaking_returns_keywords_and_highlights():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/matchmaking", json={
            "problem_description": "Samotni seniorzy na wsi nie mają jak dojechać do lekarza, autobus nie kursuje.",
            "powiat": "gorlicki",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["matches"], "zapytanie kontrolne powinno mieć dopasowania"
        top = data["matches"][0]
        assert top["title"] == "Mobilny Doradca Seniora"
        lowered = [k.lower() for k in top["matched_keywords"]]
        assert "samotni" in lowered and "wsi" in lowered and "dojechać" in lowered

        query = data["clean_query"]
        assert data["highlights"]
        previous_end = -1
        for h in data["highlights"]:
            assert query[h["start"]:h["end"]] == h["text"]
            assert h["start"] >= previous_end, "fragmenty nie mogą się nakładać"
            assert h["reasons"]
            previous_end = h["end"]


@pytest.mark.asyncio
async def test_similar_reports_are_aggregated_without_resident_text():
    secret_phrase = "Nasza sąsiadka z czerwonym parasolem"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        first = await ac.post("/api/v1/matchmaking", json={
            "problem_description": f"{secret_phrase} – seniorka – nie radzi sobie z e-receptą i bankowością internetową.",
            "powiat": "miechowski",
        })
        assert first.status_code == 200
        second = await ac.post("/api/v1/matchmaking", json={
            "problem_description": "Seniorzy nie umieją obsługiwać smartfona ani e-recepty.",
            "powiat": "miechowski",
        })
        data = second.json()
        assert data["similar_reports_total"] >= 2  # wpis z Rejestru Wyzwań (seed) + poprzednie zapytanie
        groups = data["similar_reports"]
        assert groups[0]["powiat"] == "miechowski" and groups[0]["is_user_powiat"]
        assert groups[0]["count"] >= 2
        assert groups[0]["powiat_label"] == "powiat miechowski"
        # Treść zapytań mieszkańców nie wraca do innych użytkowników
        assert secret_phrase not in second.text
        assert all(len(t) <= 120 for g in groups for t in g["example_titles"])


@pytest.mark.asyncio
async def test_no_match_path_is_kept():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/matchmaking", json={
            "problem_description": "Na drodze powiatowej są dziury w asfalcie i brakuje oświetlenia.",
        })
        data = res.json()
        assert res.status_code == 200
        assert data["no_match"] is True and data["matches"] == []
        assert data["highlights"] == []
        assert isinstance(data["similar_reports"], list)
