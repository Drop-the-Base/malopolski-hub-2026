from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer
from datetime import datetime
from app.models.base import Base


class EducationalMaterialRecord(Base):
    """Materiały edukacyjne Zasobnika Wiedzy – edytowane przez koordynatora ROPS w panelu."""
    __tablename__ = "educational_materials"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Metodyka")
    description = Column(Text, nullable=False, default="")
    download_url = Column(String, nullable=False)
    format = Column(String, nullable=False, default="Strona zewnętrzna")
    is_external = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
