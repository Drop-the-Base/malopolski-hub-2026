from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
from app.models.base import Base


class AppState(Base):
    """Proste ustawienia/stany aplikacji klucz–wartość (np. czas ostatniego logowania koordynatora ROPS)."""
    __tablename__ = "app_state"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
