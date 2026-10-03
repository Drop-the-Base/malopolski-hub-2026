from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.admin_trends_schema import TrendRadarSummary, SubmissionStatusUpdate
from app.services.trend_analyzer import analyze_social_trends, get_pending_submissions, update_submission_status

router = APIRouter()

@router.get("/admin/trends", response_model=TrendRadarSummary, tags=["Moduł VI: Panel Administratora i Radar Trendów"])
async def get_trend_radar(db: AsyncSession = Depends(get_db)):
    """
    [OPCJA ZBIEŻNA Z REGULAMINEM – ZARZĄDZENIE DANYMI O POTRZEBACH]
    Radar Trendów Społecznych Małopolski:
    Agregacja potrzeb mieszkańców, wykrywanie rosnących wyzwań w powiatach,
    systemowe białe plamy i rekomendacje dla Zarządu Województwa.
    """
    return await analyze_social_trends(db)

@router.get("/admin/submissions", tags=["Moduł VI: Panel Administratora"])
async def list_admin_submissions(db: AsyncSession = Depends(get_db)):
    """Kolejka moderacji fiszek pomysłów dla koordynatora ROPS."""
    return await get_pending_submissions(db)

@router.patch("/admin/submissions/{fiszka_id}/status", tags=["Moduł VI: Panel Administratora"])
async def change_submission_status(fiszka_id: str, payload: SubmissionStatusUpdate, db: AsyncSession = Depends(get_db)):
    """Weryfikacja fiszki: akceptacja do publikacji, odrzucenie lub zwrot z uwagami."""
    success = await update_submission_status(db, fiszka_id, payload.new_status, payload.admin_feedback)
    if not success:
        raise HTTPException(status_code=404, detail="Fiszka o podanym ID nie została odnaleziona.")
    return {"status": "updated", "fiszka_id": fiszka_id, "new_status": payload.new_status}
