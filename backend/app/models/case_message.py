from sqlalchemy import Column, String, Text, DateTime, Boolean
from datetime import datetime
from app.models.base import Base


class CaseMessage(Base):
    """Lekki wątek w sprawie (fiszka / zgłoszenie): pytania autora i odpowiedzi koordynatora ROPS."""
    __tablename__ = "case_messages"

    id = Column(String, primary_key=True, index=True)
    case_type = Column(String, nullable=False, default="fiszka")  # 'fiszka'
    case_id = Column(String, nullable=False, index=True)
    sender = Column(String, nullable=False)  # 'author' | 'rops' | 'mentor'
    # Podpis nadawcy widoczny dla autora (G15: opinia mentora z imieniem i specjalizacją)
    sender_name = Column(String, nullable=True)
    sender_role = Column(String, nullable=True)
    mentor_id = Column(String, nullable=True, index=True)
    body = Column(Text, nullable=False)
    read_by_rops = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
