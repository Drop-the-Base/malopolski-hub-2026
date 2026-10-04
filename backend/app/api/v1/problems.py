import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import require_admin
from app.models.problem_report import ProblemReport
from app.models.innovation import Innovation
from app.schemas.problem_schema import (
    ProblemReportCreate,
    ProblemReportResponse,
    ProblemReportUpdate,
    ProblemAssignRequest,
    MunicipalReportSummary
)
from collections import Counter
from app.core.constants import normalize_powiat
from app.services.matchmaking_service import populate_vector_store_if_needed, rank_innovations
from app.services.notification_service import notify, ADMIN_RECIPIENT
from app.services.pii_filter import anonymize_text
from app.services.webhook_service import fire_event

router = APIRouter(prefix="/problems", tags=["Moduł VIII: Rejestr Problemów i Panel Urzędnika JST"], dependencies=[Depends(require_admin)])

@router.get("", response_model=List[ProblemReportResponse])
async def list_problems(
    powiat: Optional[str] = Query(None, description="Filtruj wg powiatu"),
    category: Optional[str] = Query(None, description="Filtruj wg kategorii"),
    urgency: Optional[str] = Query(None, description="Filtruj wg pilności"),
    status: Optional[str] = Query(None, description="Filtruj wg statusu"),
    reporter_type: Optional[str] = Query(None, description="Filtruj wg zgłaszającego"),
    include_matchmaking: bool = Query(False, description="Dołącz anonimowe zapytania z Matchmakingu"),
    db: AsyncSession = Depends(get_db)
):
    """
    Pobiera rejestr zgłoszonych wyzwań społecznych z możliwością filtrowania
    dla wójtów, burmistrzów, dyrektorów CUS/OPS oraz ekspertów ROPS Kraków.
    """
    query = select(ProblemReport).order_by(ProblemReport.created_at.desc())

    if powiat:
        query = query.where(ProblemReport.powiat == powiat)
    if category:
        query = query.where(ProblemReport.category == category)
    if urgency:
        query = query.where(ProblemReport.urgency == urgency)
    if status:
        query = query.where(ProblemReport.status == status)
    if reporter_type:
        query = query.where(ProblemReport.reporter_type == reporter_type)
    if not include_matchmaking:
        query = query.where(ProblemReport.status != "matched")

    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=ProblemReportResponse)
async def create_problem_report(
    req: ProblemReportCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Rejestracja nowego wyzwania społecznego przez urzędnika samorządowego (JST/OPS/CUS)
    lub mieszkańca. Automatycznie filtruje dane wrażliwe (Zero-PII) i kojarzy innowacje ROPS.
    """
    clean_text = anonymize_text(req.raw_text)

    # Automatyczne kojarzenie innowacji (ten sam silnik co Matchmaking)
    await populate_vector_store_if_needed(db)
    ranked, _ = rank_innovations(f"{req.title}. {clean_text}", req.category, 3)
    matched_ids: List[str] = [r["id"] for r in ranked]
    category = req.category or (ranked[0]["meta"]["category"] if ranked else None)

    prob_id = f"prob-{uuid.uuid4().hex[:8]}"
    report = ProblemReport(
        id=prob_id,
        title=anonymize_text(req.title),
        raw_text=clean_text,
        clean_text=clean_text,
        category=category,
        powiat=req.powiat,
        gmina=req.gmina,
        reporter_type=req.reporter_type,
        reporter_name=req.reporter_name,
        reporter_role=req.reporter_role,
        urgency=req.urgency,
        affected_count=req.affected_count,
        matched_innovations=matched_ids,
        status="nowy"
    )

    db.add(report)
    if req.urgency == "krytyczny":
        where = f"Powiat {report.powiat}" + (f", gmina {report.gmina}" if report.gmina else "")
        await notify(db, ADMIN_RECIPIENT, subject=f"Krytyczne wyzwanie: {report.title}",
                     body=f"{where}. Dotyczy ok. {report.affected_count} osób.",
                     related_type="problem", related_id=prob_id)
    await db.commit()
    await db.refresh(report)
    # Integracja: zdarzenie bez danych zgłaszającego (fail-safe, w tle)
    fire_event("problem_report.created", {
        "id": report.id, "title": report.title, "powiat": report.powiat, "gmina": report.gmina,
        "category": report.category, "urgency": report.urgency, "affected_count": report.affected_count,
        "reporter_type": report.reporter_type, "status": report.status,
        "matched_innovations": report.matched_innovations or [], "created_at": report.created_at,
    })
    return report

@router.get("/{problem_id}", response_model=ProblemReportResponse)
async def get_problem_report(
    problem_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Pobranie szczegółów pojedynczego zgłoszenia wyzwania społecznego."""
    result = await db.execute(select(ProblemReport).where(ProblemReport.id == problem_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Nie znaleziono zgłoszenia wyzwania.")
    return report

@router.patch("/{problem_id}", response_model=ProblemReportResponse)
async def update_problem_report(
    problem_id: str,
    req: ProblemReportUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Aktualizacja statusu, poziomu pilności lub notatek urzędowych dla danego wyzwania."""
    result = await db.execute(select(ProblemReport).where(ProblemReport.id == problem_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Nie znaleziono zgłoszenia wyzwania.")

    if req.status is not None:
        report.status = req.status
    if req.urgency is not None:
        report.urgency = req.urgency
    if req.assigned_innovation_id is not None:
        if req.assigned_innovation_id and not await db.get(Innovation, req.assigned_innovation_id):
            raise HTTPException(status_code=422, detail="Nie znaleziono wskazanej innowacji.")
        report.assigned_innovation_id = req.assigned_innovation_id or None
    if req.assigned_notes is not None:
        report.assigned_notes = req.assigned_notes

    await db.commit()
    await db.refresh(report)
    return report

@router.post("/{problem_id}/assign-innovation", response_model=ProblemReportResponse)
async def assign_innovation(
    problem_id: str,
    req: ProblemAssignRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Przypisanie sprawdzonej innowacji ROPS Kraków do rozwiązania zgłoszonego problemu.
    Automatycznie zmienia status zgłoszenia na 'przypisana_innowacja'.
    """
    result = await db.execute(select(ProblemReport).where(ProblemReport.id == problem_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Nie znaleziono zgłoszenia wyzwania.")

    if not await db.get(Innovation, req.innovation_id):
        raise HTTPException(status_code=422, detail="Nie znaleziono wskazanej innowacji.")
    report.assigned_innovation_id = req.innovation_id
    if req.notes:
        report.assigned_notes = req.notes
    report.status = "przypisana_innowacja"

    await db.commit()
    await db.refresh(report)
    return report

@router.get("/summary/regional", response_model=MunicipalReportSummary)
async def get_municipal_diagnostic_summary(
    powiat: str = Query("miechowski", description="Powiat do wygenerowania raportu"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generuje zagregowany raport diagnostyczny dla włodarzy samorządu i ROPS Kraków:
    sumaryczna liczba wyzwań, liczba dotkniętych mieszkańców oraz rekomendowane innowacje.
    """
    try:
        powiat = normalize_powiat(powiat) or "miechowski"
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    res = await db.execute(select(ProblemReport).where(ProblemReport.powiat == powiat))
    reports = res.scalars().all()

    total_challenges = len(reports)
    critical_challenges = sum(1 for r in reports if r.urgency == "krytyczny")
    total_affected = sum(r.affected_count or 0 for r in reports)

    categories_count = {}
    for r in reports:
        cat = r.category or "ogólne"
        categories_count[cat] = categories_count.get(cat, 0) + 1

    top_categories = [{"category": k, "count": v} for k, v in categories_count.items()]

    # Rekomendacje: innowacje najczęściej przypisywane / dopasowywane do zgłoszeń z tego powiatu
    freq = Counter()
    for r in reports:
        freq.update([r.assigned_innovation_id] if r.assigned_innovation_id else (r.matched_innovations or []))
    recommended = []
    for inn_id, count in freq.most_common(3):
        inn = await db.get(Innovation, inn_id)
        if inn and inn.is_published:
            recommended.append({"id": inn.id, "title": inn.title, "tagline": inn.tagline, "category": inn.category,
                                "matched_reports": count})

    return MunicipalReportSummary(
        powiat=powiat,
        total_challenges=total_challenges,
        critical_challenges=critical_challenges,
        total_affected_residents=total_affected,
        top_categories=top_categories,
        recommended_innovations=recommended
    )
