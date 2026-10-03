from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class IdeaFiszka(Base):
    __tablename__ = "idea_fiszkas"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    summary = Column(Text, nullable=False)
    target_audience = Column(String, nullable=False)
    implementation_stage = Column(String, default="pomysl")  # 'pomysl', 'prototyp', 'pilot'
    author_name = Column(String, nullable=False)
    author_email = Column(String, nullable=False)
    author_type = Column(String, default="mieszkaniec")  # 'mieszkaniec', 'ngo', 'grupa_nieformalna', 'jst'
    powiat = Column(String, nullable=False, index=True)
    status = Column(String, default="submitted")  # 'draft', 'submitted', 'verified_by_rops', 'rejected'
    admin_notes = Column(Text, nullable=True)
    assigned_mentor_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    canvas = relationship("CanvasModel", back_populates="fiszka", uselist=False, cascade="all, delete-orphan")

class CanvasModel(Base):
    __tablename__ = "canvas_models"

    id = Column(String, primary_key=True, index=True)
    fiszka_id = Column(String, ForeignKey("idea_fiszkas.id"), nullable=True)
    problem = Column(Text, default="")
    target_group = Column(Text, default="")
    value_proposition = Column(Text, default="")
    barriers = Column(Text, default="")
    resources = Column(Text, default="")
    partners = Column(Text, default="")
    testing_plan = Column(Text, default="")
    metrics = Column(Text, default="")
    scalability = Column(Text, default="")
    ai_audit_score = Column(Integer, default=0)
    ai_audit_feedback = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fiszka = relationship("IdeaFiszka", back_populates="canvas")
