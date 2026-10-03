from sqlalchemy import Column, String, Text, DateTime, Boolean
from datetime import datetime
from app.models.base import Base

class Notification(Base):
    """Skrzynka powiadomień: e-mail do autorów/mentorów oraz powiadomienia w panelu ROPS."""
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    recipient = Column(String, nullable=False, index=True)  # adres e-mail lub 'rops_admin'
    channel = Column(String, default="email")  # 'email', 'panel'
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    related_type = Column(String, nullable=True)  # 'fiszka', 'booking', 'problem'
    related_id = Column(String, nullable=True)
    delivery_status = Column(String, default="queued")  # 'queued', 'sent', 'failed', 'in_app'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
