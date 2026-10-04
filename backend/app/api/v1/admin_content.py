"""Panel ROPS (G8): edycja materiałów i wyzwań powiatów, eksport CSV, licznik „nowe od ostatniego logowania”."""
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import category_label
from app.core.database import get_db
from app.core.security import require_admin_claims
from app.models.communication import MentorBooking
from app.models.educational_material import EducationalMaterialRecord
from app.models.idea_fiszka import IdeaFiszka
from app.models.problem_report import ProblemReport
from app.models.regional_stat import RegionalStat
from app.models.testing import TestingFeedback
from app.schemas.idea_schema import FISZKA_STATUSES, IMPLEMENTATION_STAGES
from app.schemas.innovation_schema import (
    EducationalMaterialAdmin, EducationalMaterialUpsert, RegionalChallengeSummary, RegionalChallengeUpdate
)
from app.services.export_service import NEEDS_HEADER, aggregate_needs, csv_response, needs_rows, to_csv
from app.services.knowledge_service import ensure_materials_seeded, get_educational_materials, material_to_admin

TAG = "Moduł VI: Panel Administratora"
router = APIRouter(prefix="/admin", tags=[TAG], dependencies=[Depends(require_admin_claims)])

# Przy pierwszym logowaniu (brak poprzedniego) licznik obejmuje ostatnie 7 dni
FIRST_LOGIN_WINDOW_DAYS = 7


# --- Materiały edukacyjne ---------------------------------------------------------------------------------------

@router.get("/materials", response_model=List[EducationalMaterialAdmin])
async def admin_list_materials(db: AsyncSession = Depends(get_db)):
    """Wszystkie materiały, także ukryte (do edycji)."""
    return await get_educational_materials(db, include_hidden=True)


@router.post("/materials", response_model=EducationalMaterialAdmin, status_code=201)
async def admin_create_material(req: EducationalMaterialUpsert, db: AsyncSession = Depends(get_db)):
    await ensure_materials_seeded(db)
    ids = (await db.execute(select(EducationalMaterialRecord.id))).scalars().all()
    numbers = [int(m.group(1)) for i in ids if (m := re.fullmatch(r"mat-(\d+)", i))]
    record = EducationalMaterialRecord(
        id=f"mat-{(max(numbers) + 1) if numbers else 1:03d}",
        is_external=req.download_url.startswith("https://"),
        **req.model_dump(),
    )
    db.add(record)
    await db.commit()
    return material_to_admin(record)


@router.put("/materials/{material_id}", response_model=EducationalMaterialAdmin)
async def admin_update_material(material_id: str, req: EducationalMaterialUpsert, db: AsyncSession = Depends(get_db)):
    record = await db.get(EducationalMaterialRecord, material_id)
    if not record:
        raise HTTPException(status_code=404, detail="Nie znaleziono materiału.")
    for key, value in req.model_dump().items():
        setattr(record, key, value)
    record.is_external = req.download_url.startswith("https://")
    record.updated_at = datetime.utcnow()
    await db.commit()
    return material_to_admin(record)


@router.delete("/materials/{material_id}")
async def admin_hide_material(material_id: str, db: AsyncSession = Depends(get_db)):
    """Ukrycie materiału (dane zostają w bazie, można go przywrócić)."""
    record = await db.get(EducationalMaterialRecord, material_id)
    if not record:
        raise HTTPException(status_code=404, detail="Nie znaleziono materiału.")
    record.is_published = False
    await db.commit()
    return {"status": "hidden", "id": material_id}


# --- Wyzwania powiatów (Mapa Wyzwań) -----------------------------------------------------------------------------

@router.put("/challenges/{powiat_code}", response_model=RegionalChallengeSummary)
async def admin_update_challenge(powiat_code: str, req: RegionalChallengeUpdate, db: AsyncSession = Depends(get_db)):
    """Szybka edycja kluczowego wyzwania powiatu (i trendu demograficznego) na Mapie Wyzwań."""
    stat = await db.get(RegionalStat, powiat_code)
    if not stat:
        raise HTTPException(status_code=404, detail="Nie znaleziono powiatu o podanym kodzie.")
    stat.key_social_challenge = req.key_social_challenge.strip()
    if req.demographic_trend is not None and req.demographic_trend.strip():
        stat.demographic_trend = req.demographic_trend.strip()
    await db.commit()
    return RegionalChallengeSummary(
        powiat_code=stat.powiat_code, powiat_name=stat.powiat_name, population=stat.population,
        senior_share_pct=stat.senior_share_pct, youth_share_pct=stat.youth_share_pct,
        demographic_trend=stat.demographic_trend, reported_problems_count=stat.reported_problems_count,
        active_innovations_count=stat.active_innovations_count, key_social_challenge=stat.key_social_challenge,
    )


# --- Eksport CSV --------------------------------------------------------------------------------------------------

@router.get("/export/{kind}.csv", response_class=Response, responses={200: {"content": {"text/csv": {}}}})
async def admin_export_csv(kind: Literal["ideas", "problems", "needs"], db: AsyncSession = Depends(get_db)):
    """
    Eksport do arkusza (CSV, separator `;`, UTF-8 z BOM): `ideas` – fiszki pomysłów, `problems` – Rejestr Wyzwań
    i anonimowe zapytania Matchmakingu, `needs` – potrzeby zagregowane per powiat i obszar.
    Eksport nie zawiera danych kontaktowych autorów ani zgłaszających (minimalizacja danych, RODO).
    """
    if kind == "ideas":
        rows = (await db.execute(select(IdeaFiszka).order_by(IdeaFiszka.created_at.desc()))).scalars().all()
        header = ["id", "data_zgloszenia", "tytul", "streszczenie", "grupa_docelowa", "etap", "powiat", "typ_autora",
                  "status", "klaster", "glosy_poparcia", "komentarz_rops", "ostatnia_zmiana"]
        data = [[f.id, f.created_at, f.title, f.summary, f.target_audience,
                 IMPLEMENTATION_STAGES.get(f.implementation_stage, f.implementation_stage), f.powiat, f.author_type,
                 FISZKA_STATUSES.get(f.status, f.status), f.cluster_group, f.votes_count, f.admin_notes, f.updated_at]
                for f in rows]
        return csv_response(to_csv(header, data), "mhis-fiszki")
    if kind == "problems":
        rows = (await db.execute(select(ProblemReport).order_by(ProblemReport.created_at.desc()))).scalars().all()
        header = ["id", "data_zgloszenia", "zrodlo", "powiat", "gmina", "obszar", "pilnosc", "status",
                  "typ_zglaszajacego", "osoby_dotkniete", "tytul", "opis_zanonimizowany", "dopasowane_innowacje",
                  "przypisana_innowacja"]
        data = [[r.id, r.created_at, "matchmaking" if r.status == "matched" else "rejestr_wyzwan", r.powiat, r.gmina,
                 category_label(r.category) if r.category else "", r.urgency, r.status, r.reporter_type,
                 r.affected_count, r.title, r.clean_text, r.matched_innovations or [], r.assigned_innovation_id]
                for r in rows]
        return csv_response(to_csv(header, data), "mhis-zgloszenia")
    return csv_response(to_csv(NEEDS_HEADER, needs_rows(await aggregate_needs(db))), "mhis-potrzeby")


# --- Nowe od ostatniego logowania ---------------------------------------------------------------------------------

class NewSinceLogin(BaseModel):
    since: datetime
    first_login: bool
    new_ideas: int
    new_problem_reports: int
    new_matchmaking_queries: int
    new_tester_feedback: int
    new_mentor_bookings: int
    total: int


@router.get("/new-since-login", response_model=NewSinceLogin)
async def admin_new_since_login(
    db: AsyncSession = Depends(get_db), claims: Dict[str, Any] = Depends(require_admin_claims)
):
    """Ile nowych fiszek, zgłoszeń i opinii przybyło od poprzedniego logowania koordynatora."""
    since: Optional[datetime] = None
    if claims.get("prev_login"):
        try:
            since = datetime.fromisoformat(claims["prev_login"])
        except ValueError:
            since = None
    first_login = since is None
    if first_login:
        since = datetime.utcnow() - timedelta(days=FIRST_LOGIN_WINDOW_DAYS)

    async def count(model, *where) -> int:
        q = select(func.count()).select_from(model).where(model.created_at > since, *where)
        return (await db.execute(q)).scalar() or 0

    ideas = await count(IdeaFiszka)
    problems = await count(ProblemReport, ProblemReport.status != "matched")
    queries = await count(ProblemReport, ProblemReport.status == "matched")
    feedback = await count(TestingFeedback)
    bookings = await count(MentorBooking)
    return NewSinceLogin(
        since=since, first_login=first_login, new_ideas=ideas, new_problem_reports=problems,
        new_matchmaking_queries=queries, new_tester_feedback=feedback, new_mentor_bookings=bookings,
        total=ideas + problems + queries + feedback + bookings,
    )
