"""Subskrypcje powiadomień (G5): dopasowanie subskrybentów i wysyłka przez skrzynkę nadawczą (notification_service)."""
import logging
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.subscription import Subscription
from app.services.notification_service import notify

logger = logging.getLogger(__name__)

ALERT_RELATED_TYPE = "subscription_alert"


def unsubscribe_path(token: str) -> str:
    return f"/powiadomienia/wypisz/{token}"


def mask_email(email: str) -> str:
    """jan.kowalski@example.org -> ja***@example.org"""
    local, _, domain = email.partition("@")
    visible = local[:2] if len(local) > 2 else local[:1]
    return f"{visible}***@{domain}"


def matches(sub: Subscription, topic: str, category: Optional[str], powiat: Optional[str]) -> bool:
    """Brak wybranych kategorii/powiatów = wszystkie; ogłoszenie bez kategorii/powiatu dotyczy wszystkich."""
    if topic not in (sub.topics or []):
        return False
    if category and sub.categories and category not in sub.categories:
        return False
    if powiat and sub.powiaty and powiat not in sub.powiaty:
        return False
    return True


async def notify_subscribers(
    db: AsyncSession,
    topic: str,
    subject: str,
    body: str,
    category: Optional[str] = None,
    powiat: Optional[str] = None,
    related_id: Optional[str] = None,
) -> int:
    """Kolejkuje e-mail do każdego pasującego, aktywnego subskrybenta (z linkiem do wypisania). Commit – wywołujący."""
    subs = (await db.execute(select(Subscription).where(Subscription.is_active.is_(True)))).scalars().all()
    count = 0
    for sub in subs:
        if not matches(sub, topic, category, powiat):
            continue
        await notify(
            db, sub.email, subject=subject,
            body=(f"{body}\n\nOtrzymujesz tę wiadomość, bo zapisałeś(-aś) się na powiadomienia w Małopolskim Hubie "
                  f"Innowacji Społecznych. Wypisz się jednym kliknięciem: {unsubscribe_path(sub.token)}"),
            related_type=ALERT_RELATED_TYPE, related_id=related_id,
        )
        count += 1
    if count:
        logger.info(f"Powiadomienie subskrybentów ({topic}): {count} e-maili w kolejce")
    return count
