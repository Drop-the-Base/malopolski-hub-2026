import asyncio
import logging
import smtplib
import uuid
from email.message import EmailMessage
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.notification import Notification

logger = logging.getLogger(__name__)

ADMIN_RECIPIENT = "rops_admin"


def _send_smtp(recipient: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
        smtp.starttls()
        if settings.SMTP_USER:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(msg)


async def notify(
    db: AsyncSession,
    recipient: str,
    subject: str,
    body: str,
    related_type: Optional[str] = None,
    related_id: Optional[str] = None,
) -> Notification:
    """
    Zapisuje powiadomienie w skrzynce nadawczej. Dla adresów e-mail próbuje wysłać wiadomość przez SMTP
    (jeśli skonfigurowano SMTP_HOST); powiadomienia dla ROPS trafiają do panelu administratora.
    Commit wykonuje wywołujący.
    """
    is_panel = recipient == ADMIN_RECIPIENT
    notification = Notification(
        id=f"notif-{uuid.uuid4().hex[:10]}",
        recipient=recipient,
        channel="panel" if is_panel else "email",
        subject=subject,
        body=body,
        related_type=related_type,
        related_id=related_id,
        delivery_status="in_app" if is_panel else "queued",
    )
    if not is_panel and settings.SMTP_HOST:
        try:
            await asyncio.to_thread(_send_smtp, recipient, subject, body)
            notification.delivery_status = "sent"
        except Exception as e:  # brak SMTP nie może blokować zgłoszenia
            logger.warning(f"Nie udało się wysłać e-maila do {recipient}: {e}")
            notification.delivery_status = "failed"
    db.add(notification)
    return notification
