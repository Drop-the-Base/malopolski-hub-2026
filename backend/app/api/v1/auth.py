from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_admin_token, verify_admin_password
from app.models.app_state import AppState

LAST_LOGIN_KEY = "admin_last_login_at"

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
    previous_login_at: Optional[datetime] = None


@router.post("/auth/login", response_model=LoginResponse, tags=["Uwierzytelnianie"])
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Logowanie koordynatora / sędziego do Panelu Urzędnika ROPS. Czas poprzedniego logowania trafia do tokenu
    (licznik „nowe od ostatniego logowania” w panelu), a bieżący jest zapisywany w bazie.
    """
    if not verify_admin_password(req.password):
        raise HTTPException(status_code=401, detail="Nieprawidłowe hasło.")
    state = await db.get(AppState, LAST_LOGIN_KEY)
    previous_login = None
    if state and state.value:
        try:
            previous_login = datetime.fromisoformat(state.value)
        except ValueError:
            previous_login = None
    now = datetime.utcnow()
    if state:
        state.value = now.isoformat()
    else:
        db.add(AppState(key=LAST_LOGIN_KEY, value=now.isoformat()))
    await db.commit()
    username = (req.username or "sedzia.hackyeah@malopolska.pl").strip()
    role = "judge" if "sedzia" in username.lower() else "worker"
    return LoginResponse(
        access_token=create_admin_token(previous_login),
        expires_in_minutes=settings.ADMIN_TOKEN_TTL_MINUTES,
        user_name=username,
        user_role=role,
        previous_login_at=previous_login,
    )
