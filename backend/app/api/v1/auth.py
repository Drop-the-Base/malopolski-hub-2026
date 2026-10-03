from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.security import create_admin_token, verify_admin_password

router = APIRouter()


class LoginRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=200)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


@router.post("/auth/login", response_model=LoginResponse, tags=["Uwierzytelnianie"])
async def login(req: LoginRequest):
    """Logowanie koordynatora ROPS do panelu administratora (wersja demonstracyjna – jedno hasło)."""
    if not verify_admin_password(req.password):
        raise HTTPException(status_code=401, detail="Nieprawidłowe hasło.")
    return LoginResponse(access_token=create_admin_token(), expires_in_minutes=settings.ADMIN_TOKEN_TTL_MINUTES)
