from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageItem(BaseModel):
    id: str
    sender_name: str
    sender_role: str
    content: str
    created_at: datetime

class ThreadCreate(BaseModel):
    title: str = Field(..., min_length=5)
    category: str
    author_name: str
    author_role: str = "mieszkaniec"
    powiat: str
    initial_message: str

class ThreadDetail(BaseModel):
    id: str
    title: str
    category: str
    author_name: str
    author_role: str
    powiat: str
    status: str
    created_at: datetime
    messages: List[MessageItem]

class MentorProfile(BaseModel):
    id: str
    full_name: str
    specialization: str
    bio: str
    available_hours: str
    contact_email: str
    avatar_url: Optional[str] = None
