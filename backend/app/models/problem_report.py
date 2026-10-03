from sqlalchemy import Column, String, Text, DateTime, JSON, Integer
from datetime import datetime
from app.models.base import Base

class ProblemReport(Base):
    __tablename__ = "problem_reports"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=True)
    raw_text = Column(Text, nullable=False)
    clean_text = Column(Text, nullable=False)
    category = Column(String, index=True, nullable=True)
    powiat = Column(String, index=True, nullable=True)
    gmina = Column(String, nullable=True)
    reporter_type = Column(String, default="urzednik_jst")  # 'urzednik_jst', 'pracownik_ops_cus', 'mieszkaniec', 'ngo'
    reporter_name = Column(String, nullable=True)
    reporter_role = Column(String, nullable=True)
    urgency = Column(String, default="standardowy")  # 'krytyczny', 'wysoki', 'standardowy'
    affected_count = Column(Integer, default=0)
    matched_innovations = Column(JSON, default=list)
    assigned_innovation_id = Column(String, nullable=True)
    assigned_notes = Column(Text, nullable=True)
    status = Column(String, default="nowy")  # 'nowy', 'w_analizie', 'przypisana_innowacja', 'wdrazany', 'rozwiazany'
    created_at = Column(DateTime, default=datetime.utcnow)

