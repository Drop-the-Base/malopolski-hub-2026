from sqlalchemy import Column, String, Text, DateTime, JSON
from datetime import datetime
from app.models.base import Base

class ProblemReport(Base):
    __tablename__ = "problem_reports"

    id = Column(String, primary_key=True, index=True)
    raw_text = Column(Text, nullable=False)
    clean_text = Column(Text, nullable=False)
    category = Column(String, index=True, nullable=True)
    powiat = Column(String, index=True, nullable=True)
    gmina = Column(String, nullable=True)
    reporter_type = Column(String, default="mieszkaniec")
    matched_innovations = Column(JSON, default=list)
    status = Column(String, default="matched")  # 'matched', 'converted_to_idea'
    created_at = Column(DateTime, default=datetime.utcnow)
