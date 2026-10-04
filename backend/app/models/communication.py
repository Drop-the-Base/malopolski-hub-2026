from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class CommunicationThread(Base):
    __tablename__ = "communication_threads"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)  # 'rops_qa', 'poszukiwanie_partnera', 'konsultacja_mentorska'
    author_name = Column(String, nullable=False)
    author_role = Column(String, nullable=False)  # 'mieszkaniec', 'ngo', 'jst', 'mentor'
    powiat = Column(String, nullable=False)
    status = Column(String, default="open")  # 'open', 'in_progress', 'resolved'
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("ThreadMessage", back_populates="thread", cascade="all, delete-orphan")

class ThreadMessage(Base):
    __tablename__ = "thread_messages"

    id = Column(String, primary_key=True, index=True)
    thread_id = Column(String, ForeignKey("communication_threads.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    sender_role = Column(String, nullable=False)  # 'mieszkaniec', 'rops_ekspert', 'mentor', 'jst'
    content = Column(Text, nullable=False)
    mentor_id = Column(String, nullable=True)  # odpowiedź z panelu mentora (zweryfikowany mentor)
    created_at = Column(DateTime, default=datetime.utcnow)

    thread = relationship("CommunicationThread", back_populates="messages")

class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    bio = Column(Text, nullable=False)
    available_hours = Column(String, default="Czwartki 14:00 - 18:00")
    contact_email = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)

class MentorBooking(Base):
    __tablename__ = "mentor_bookings"

    id = Column(String, primary_key=True, index=True)
    mentor_id = Column(String, ForeignKey("mentors.id"), nullable=False, index=True)
    slot_start = Column(DateTime, nullable=False)
    requester_name = Column(String, nullable=False)
    requester_email = Column(String, nullable=False)
    topic = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
