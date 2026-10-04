from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Małopolski Hub Innowacji Społecznych"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/mhis.db"
    VECTOR_STORE_DIR: str = "./data/vector_store"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    # Demo-logowanie koordynatora ROPS (panel administratora). W produkcji: SSO / Keycloak.
    SECRET_KEY: str = "zmien-mnie-w-produkcji-mhis-2026"
    ADMIN_PASSWORD: str = "rops-demo-2026"
    ADMIN_TOKEN_TTL_MINUTES: int = 480
    # Demo-dostęp mentora / eksperta (panel /mentor): wybór osoby + wspólny kod dostępu. W produkcji: indywidualne konta.
    MENTOR_PASSWORD: str = "mentor-demo-2026"
    ADMIN_NOTIFY_EMAIL: str = "innowacje@rops.example.org"
    # Opcjonalna wysyłka e-mail (bez SMTP_HOST powiadomienia trafiają tylko do skrzynki nadawczej w bazie)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "hub-innowacji@rops.example.org"
    # Opcjonalny webhook wychodzący (nowa fiszka / nowy wpis Rejestru Wyzwań). Puste = wyłączony.
    WEBHOOK_URL: str = ""
    WEBHOOK_SECRET: str = ""
    WEBHOOK_TIMEOUT_SECONDS: float = 5.0
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:80",
        "http://127.0.0.1"
    ]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
