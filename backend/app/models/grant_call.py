from sqlalchemy import Column, String, DateTime, Integer, JSON
from datetime import datetime
from app.models.base import Base


class GrantCallRecord(Base):
    """Nabór grantowy zarządzany w Panelu ROPS (daty otwarcia/zamknięcia, limity, kryteria)."""
    __tablename__ = "grant_calls"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    opens_on = Column(String, nullable=False)  # ISO YYYY-MM-DD
    closes_on = Column(String, nullable=False)
    min_budget_pln = Column(Integer, nullable=False)
    max_budget_pln = Column(Integer, nullable=False)
    criteria = Column(JSON, default=list)
    category = Column(String, nullable=True)  # None = wszystkie obszary
    powiat = Column(String, nullable=True)  # None = cała Małopolska
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
