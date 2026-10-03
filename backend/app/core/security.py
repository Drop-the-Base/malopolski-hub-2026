"""Uproszczone uwierzytelnianie koordynatora ROPS (token JWT HS256) dla panelu administratora."""
import hmac
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.core.config import settings

ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


def verify_admin_password(password: str) -> bool:
    return hmac.compare_digest(password.encode("utf-8"), settings.ADMIN_PASSWORD.encode("utf-8"))


def create_admin_token() -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ADMIN_TOKEN_TTL_MINUTES)
    return jwt.encode({"sub": "rops_admin", "role": "admin", "exp": expire}, settings.SECRET_KEY, algorithm=ALGORITHM)


async def require_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)) -> str:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Wymagane zalogowanie do Panelu ROPS.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise unauthorized
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise unauthorized
    if payload.get("role") != "admin":
        raise unauthorized
    return payload["sub"]
