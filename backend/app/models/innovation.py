from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON
from datetime import datetime
from app.models.base import Base

class Innovation(Base):
    __tablename__ = "innovations"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    tagline = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    target_groups = Column(JSON, default=list)
    full_description = Column(Text, nullable=False)
    readiness_level = Column(String, nullable=False)
    budget_bracket = Column(String, default="Średni")
    video_url = Column(String, nullable=True)
    handbook_url = Column(String, nullable=True)
    etr_summary = Column(Text, nullable=True)
    origin_poviat = Column(String, nullable=True)
    # Historia na karcie: problem → rozwiązanie (full_description) → efekt
    problem_statement = Column(Text, nullable=True)
    effect_description = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
