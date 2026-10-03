import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.problem_report import ProblemReport
from app.models.innovation import Innovation
from app.schemas.problem_schema import (
    ProblemReportCreate,
    ProblemReportResponse,
    ProblemReportUpdate,
    ProblemAssignRequest,
    MunicipalReportSummary
)
from app.services.pii_filter import anonymize_text
from app.services.vector_store import vector_store

router = APIRouter(prefix="/problems", tags=["Moduł VIII: Rejestr Problemów i Panel Urzędnika JST"])

@router.get("", response_model=List[ProblemReportResponse])
async def list_problems(
    powiat: Optional[str] = Query(None, description="Filtruj wg powiatu"),
    category: Optional[str] = Query(None, description="Filtruj wg kategorii"),
    urgency: Optional[str] = Query(None, description="Filtruj wg pilności"),
    status: Optional[str] = Query(None, description="Filtruj wg statusu"),
    reporter_type: Optional[str] = Query(None, description="Filtruj wg zgłaszającego"),
    db: AsyncSession = Depends(get_db)
):
    """
    Pobiera oficjalny rejestr zgłoszonych wyzwań społecznych z możliwością filtrowania
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

    # Automatyczne kojarzenie innowacji z wektorowej bazy
    matched_ids: List[str] = []
    if vector_store.documents:
        results = vector_store.search(query=clean_text, top_k=3, category_filter=req.category)
        matched_ids = [doc_id for doc_id, _, _ in results]

    prob_id = f"prob-{uuid.uuid4().hex[:8]}"
    report = ProblemReport(
        id=prob_id,
        title=req.title,
        raw_text=req.raw_text,
        clean_text=clean_text,
        category=req.category,
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
    await db.commit()
    await db.refresh(report)
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
        report.assigned_innovation_id = req.assigned_innovation_id
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
    Oficjalne przypisanie sprawdzonej innowacji ROPS Kraków do rozwiązania zgłoszonego problemu.
    Automatycznie zmienia status zgłoszenia na 'przypisana_innowacja'.
    """
    result = await db.execute(select(ProblemReport).where(ProblemReport.id == problem_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Nie znaleziono zgłoszenia wyzwania.")

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

    # Rekomendowane innowacje ROPS dla powiatu
    inn_res = await db.execute(select(Innovation).limit(3))
    inns = inn_res.scalars().all()
    recommended = [
        {"id": inn.id, "title": inn.title, "tagline": inn.tagline, "category": inn.category}
        for inn in inns
    ]

    return MunicipalReportSummary(
        powiat=powiat,
        total_challenges=total_challenges,
        critical_challenges=critical_challenges,
        total_affected_residents=total_affected,
        top_categories=top_categories,
        recommended_innovations=recommended
    )
