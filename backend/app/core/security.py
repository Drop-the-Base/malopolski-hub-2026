"""Uproszczone uwierzytelnianie koordynatora ROPS (token JWT HS256) dla panelu administratora."""
import hmac
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.core.config import settings

ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


def verify_admin_password(password: str) -> bool:
    return hmac.compare_digest(password.encode("utf-8"), settings.ADMIN_PASSWORD.encode("utf-8"))


def create_admin_token(previous_login: Optional[datetime] = None) -> str:
    """Token koordynatora; `prev_login` (czas poprzedniego logowania) zasila licznik „nowe od ostatniego logowania”."""
    expire = datetime.utcnow() + timedelta(minutes=settings.ADMIN_TOKEN_TTL_MINUTES)
    claims: Dict[str, Any] = {"sub": "rops_admin", "role": "admin", "exp": expire}
    if previous_login:
        claims["prev_login"] = previous_login.isoformat()
    return jwt.encode(claims, settings.SECRET_KEY, algorithm=ALGORITHM)


async def require_admin_claims(credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)) -> Dict[str, Any]:
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
    return payload


async def require_admin(claims: Dict[str, Any] = Depends(require_admin_claims)) -> str:
    return claims["sub"]


# --- Mentor / ekspert (G15) ------------------------------------------------------------------------------

def verify_mentor_code(code: str) -> bool:
    return hmac.compare_digest(code.encode("utf-8"), settings.MENTOR_PASSWORD.encode("utf-8"))


def create_mentor_token(mentor_id: str) -> str:
    """Token mentora: rola „mentor”, `sub` = identyfikator mentora. Nie daje dostępu do Panelu ROPS."""
    expire = datetime.utcnow() + timedelta(minutes=settings.ADMIN_TOKEN_TTL_MINUTES)
    claims: Dict[str, Any] = {"sub": mentor_id, "role": "mentor", "exp": expire}
    return jwt.encode(claims, settings.SECRET_KEY, algorithm=ALGORITHM)


async def require_mentor(credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)) -> str:
    """Zwraca identyfikator zalogowanego mentora (token z rolą „mentor”)."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Wymagane zalogowanie do panelu mentora.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise unauthorized
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise unauthorized
    if payload.get("role") != "mentor" or not payload.get("sub"):
        raise unauthorized
    return str(payload["sub"])
