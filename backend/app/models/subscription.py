from sqlalchemy import Column, String, DateTime, Boolean, JSON
from datetime import datetime
from app.models.base import Base


class Subscription(Base):
    """Subskrypcja powiadomień e-mail o nowych innowacjach i naborach (wg kategorii i/lub powiatu)."""
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    topics = Column(JSON, default=list)  # 'innowacje', 'nabory'
    categories = Column(JSON, default=list)  # pusta lista = wszystkie kategorie
    powiaty = Column(JSON, default=list)  # pusta lista = cała Małopolska
    token = Column(String, nullable=False, unique=True, index=True)  # do wypisania się bez logowania
    is_active = Column(Boolean, default=True)
    rodo_consent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    unsubscribed_at = Column(DateTime, nullable=True)
