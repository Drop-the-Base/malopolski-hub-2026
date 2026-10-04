"""
Opcjonalny webhook wychodzący (zmienna WEBHOOK_URL) – powiadamia system zewnętrzny (np. CRM, EZD, bramkę do
Teams/Slacka) o nowej fiszce pomysłu lub nowym wpisie Rejestru Wyzwań.

Zasady: nie blokuje odpowiedzi API (zadanie w tle), błąd wysyłki jest tylko logowany, ładunek nie zawiera danych
osobowych (bez imion, e-maili, telefonów), opcjonalny podpis HMAC-SHA256 (WEBHOOK_SECRET) w nagłówku X-MHIS-Signature.
"""
import asyncio
import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Set
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

_pending: Set[asyncio.Task] = set()


def build_payload(event: str, data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": f"evt-{uuid.uuid4().hex[:12]}",
        "event": event,
        "occurred_at": datetime.utcnow().isoformat() + "Z",
        "source": "mhis",
        "data": data,
    }


def sign(body: bytes) -> str:
    return "sha256=" + hmac.new(settings.WEBHOOK_SECRET.encode("utf-8"), body, hashlib.sha256).hexdigest()


async def _post(url: str, body: bytes, headers: Dict[str, str]) -> int:
    async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT_SECONDS) as client:
        response = await client.post(url, content=body, headers=headers)
        return response.status_code


async def _deliver(payload: Dict[str, Any]) -> None:
    url = settings.WEBHOOK_URL
    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "MHIS-Webhook/1.0",
        "X-MHIS-Event": payload["event"],
    }
    if settings.WEBHOOK_SECRET:
        headers["X-MHIS-Signature"] = sign(body)
    try:
        status = await _post(url, body, headers)
        if 200 <= status < 300:
            logger.info(f"Webhook {payload['event']} ({payload['id']}) dostarczony: HTTP {status}")
        else:
            logger.warning(f"Webhook {payload['event']} ({payload['id']}) odrzucony: HTTP {status}")
    except Exception as e:  # webhook nigdy nie może zepsuć zgłoszenia
        logger.warning(f"Webhook {payload['event']} ({payload['id']}) nie został dostarczony: {e.__class__.__name__}: {e}")


def fire_event(event: str, data: Dict[str, Any]) -> bool:
    """Wysyła zdarzenie w tle, jeśli skonfigurowano WEBHOOK_URL. Zwraca True, gdy zadanie zostało zaplanowane."""
    if not settings.WEBHOOK_URL:
        return False
    try:
        task = asyncio.get_running_loop().create_task(_deliver(build_payload(event, data)))
    except RuntimeError:
        logger.warning("Webhook pominięty: brak działającej pętli asyncio.")
        return False
    _pending.add(task)
    task.add_done_callback(_pending.discard)
    return True


async def drain() -> None:
    """Czeka na zaplanowane wysyłki (testy, zamykanie aplikacji)."""
    if _pending:
        await asyncio.gather(*list(_pending), return_exceptions=True)
