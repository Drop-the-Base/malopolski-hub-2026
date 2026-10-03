from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db, Base

router = APIRouter()

@router.get("/health", tags=["System"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Stan API: połączenie z bazą, zgodność schematu tabel z modelami i dostępność LLM."""
    schema_issues = []
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
        if "sqlite" in settings.DATABASE_URL:
            for table in Base.metadata.sorted_tables:
                rows = (await db.execute(text(f"PRAGMA table_info({table.name})"))).fetchall()
                existing = {r[1] for r in rows}
                missing = [c.name for c in table.columns if c.name not in existing]
                if missing:
                    schema_issues.append(f"{table.name}: brak kolumn {', '.join(missing)}")
    except Exception:
        db_status = "unhealthy"

    healthy = db_status == "connected" and not schema_issues
    return {
        "status": "healthy" if healthy else "degraded",
        "service": "Małopolski Hub Innowacji Społecznych API",
        "database": db_status,
        "schema_ok": not schema_issues,
        "schema_issues": schema_issues,
        "llm_configured": bool(settings.GROQ_API_KEY),
        "version": "1.1.0"
    }
