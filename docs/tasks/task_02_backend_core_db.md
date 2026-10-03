# Task 02: Backend Core, Konfiguracja Bazy Danych i Endpoint Żywotności
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Backend Architecture  
> **Szacowany czas realizacji**: 30 minut  
> **Zależności**: Task 01  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Utworzenie rdzenia backendu w FastAPI, obsługa konfiguracji z pliku `.env`, asynchroniczne połączenie z bazą SQLite (SQLAlchemy 2.0) z cyklem życia aplikacji (`lifespan`) oraz endpoint monitorujący stan zdrowia systemu (`/api/v1/health`).

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/requirements.txt`
- `backend/app/core/config.py`
- `backend/app/core/database.py`
- `backend/app/models/base.py`
- `backend/app/api/v1/health.py`
- `backend/app/main.py`
- `backend/tests/test_health.py`

---

## 3. Szczegóły Techniczne Implementacji

### 3.1. `backend/app/core/config.py`
Wykorzystać `pydantic_settings.BaseSettings`:
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Małopolski Hub Innowacji Społecznych"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/mhis.db"
    VECTOR_STORE_DIR: str = "./data/vector_store"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:80"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
```

### 3.2. `backend/app/core/database.py`
Asynchroniczny silnik SQLAlchemy:
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

### 3.3. `backend/app/api/v1/health.py`
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

@router.get("/health", tags=["System"])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy",
        "service": "Małopolski Hub Innowacji Społecznych API",
        "database": db_status,
        "version": "1.0.0"
    }
```

### 3.4. `backend/app/main.py`
Inicjalizacja aplikacji FastAPI, middleware CORS, rejestracja routerów oraz automatyczne tworzenie katalogu `data/` i tabel w bazie w ramach handlera `lifespan`.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Uruchomienie serwera lokalnie:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
2. Sprawdzenie endpointu zdrowia:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```
   Odpowiedź powinna zawierać `"status": "healthy"` oraz `"database": "connected"`.
3. Wykonanie testu jednostkowego:
   ```bash
   pytest tests/test_health.py
   ```
