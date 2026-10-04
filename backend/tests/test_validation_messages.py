"""Komunikaty walidacji po polsku, bez technicznych szczegółów (G12, WCAG 3.3.3)."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_validation_errors_are_plain_polish():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/ideas", json={"title": "x", "summary": "a", "author_email": "zly", "rodo_consent": True})
    assert res.status_code == 422
    body = res.json()
    detail = body["detail"]
    assert "Pole „Tytuł” jest za krótkie – wpisz co najmniej 3 znaki." in detail
    assert "Wpisz poprawny adres e-mail" in detail
    assert "Uzupełnij pole „Powiat”." in detail
    # bez angielskich komunikatów pydantic i wyrażeń regularnych
    for raw in ("String should", "Field required", "pattern", "^["):
        assert raw not in detail
    assert {"field", "message"} <= set(body["errors"][0])
