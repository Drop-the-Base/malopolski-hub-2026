from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$", description="'user' lub 'assistant'")
    content: str = Field(..., min_length=1, max_length=4000, description="Treść wiadomości")

class MiddlemanChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, max_length=30)
    innovation_id: str
    municipality_name: str
    powiat: str
    population: int = Field(5000, ge=100, le=1_000_000)
    senior_percentage: float = Field(25.0, ge=0, le=100)
    has_cus: bool = False
    annual_budget_pln: int = 80000
    blueprint_summary: Optional[str] = None

class MiddlemanChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str]
    latency_ms: int
