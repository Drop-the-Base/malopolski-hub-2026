from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant' lub 'system'")
    content: str = Field(..., description="Treść wiadomości")

class MiddlemanChatRequest(BaseModel):
    messages: List[ChatMessage]
    innovation_id: str
    municipality_name: str
    powiat: str
    population: int = 5000
    senior_percentage: float = 25.0
    has_cus: bool = False
    annual_budget_pln: int = 80000
    blueprint_summary: Optional[str] = None

class MiddlemanChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str]
    latency_ms: int
