from sqlalchemy import Column, String, Text, Integer, Float, Date, DateTime, ForeignKey, Boolean, JSON
from datetime import datetime, date
from app.models.base import Base

class TestingCampaign(Base):
    __tablename__ = "testing_campaigns"

    id = Column(String, primary_key=True, index=True)
    innovation_id = Column(String, ForeignKey("innovations.id"), nullable=False)
    campaign_name = Column(String, nullable=False)
    goal_description = Column(Text, nullable=False)
    tester_profile_needed = Column(String, nullable=False)
    slots_total = Column(Integer, default=20)
    slots_taken = Column(Integer, default=0)
    status = Column(String, default="open")  # 'open', 'full', 'closed'
    deadline = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

class TestingFeedback(Base):
    __tablename__ = "testing_feedback"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("testing_campaigns.id"), nullable=False)
    tester_name = Column(String, nullable=False)
    tester_role = Column(String, nullable=False)  # 'senior', 'opiekun', 'osoba_z_niepelnosprawnoscia', 'ekspert'
    sus_score = Column(Float, nullable=False)  # 0 - 100 System Usability Scale (z 10 odpowiedzi)
    sus_answers = Column(JSON, nullable=True)  # 10 odpowiedzi 1-5 kwestionariusza SUS
    usability_rating = Column(Integer, nullable=False)  # 1 - 5
    identified_barriers = Column(Text, default="")
    improvement_proposals = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class TesterSignup(Base):
    __tablename__ = "tester_signups"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("testing_campaigns.id"), nullable=False, index=True)
    tester_name = Column(String, nullable=False)
    tester_email = Column(String, nullable=False, index=True)
    tester_role = Column(String, nullable=False)
    motivation = Column(Text, default="")
    guardian_consent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
