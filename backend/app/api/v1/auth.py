from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.security import create_admin_token, verify_admin_password

router = APIRouter()


class LoginRequest(BaseModel):
    username: Optional[str] = Field("sedzia.hackyeah@malopolska.pl", max_length=200)
    password: str = Field(..., min_length=1, max_length=200)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user_name: str
    user_role: str


@router.post("/auth/login", response_model=LoginResponse, tags=["Uwierzytelnianie"])
async def login(req: LoginRequest):
    """Logowanie koordynatora / sędziego do Panelu Urzędnika ROPS."""
    if not verify_admin_password(req.password):
        raise HTTPException(status_code=401, detail="Nieprawidłowe hasło.")
    username = (req.username or "sedzia.hackyeah@malopolska.pl").strip()
    role = "judge" if "sedzia" in username.lower() else "worker"
    return LoginResponse(
        access_token=create_admin_token(),
        expires_in_minutes=settings.ADMIN_TOKEN_TTL_MINUTES,
        user_name=username,
        user_role=role
    )
