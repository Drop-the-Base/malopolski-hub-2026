"""
Teczka wdrożeń dla JST (G16): porównanie 2–3 innowacji obok siebie.

Zwraca wyłącznie dane, które istnieją: kartę innowacji, średnią ocen z Testera oraz – gdy Middleman ma profil
wdrożeniowy innowacji – szacunkowy koszt uruchomienia i utrzymania dla gminy referencyjnej i potrzeby kadrowe.
Brak danych = `null` (interfejs pokazuje „brak danych”).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import category_label, format_pl_number
from app.core.database import get_db
from app.models.innovation import Innovation
from app.models.testing import InnovationRating
from app.services.middleman_service import INNOVATION_PROFILES

router = APIRouter(tags=["Moduł II: Zasobnik Wiedzy"])

MAX_COMPARE = 3
# Gmina referencyjna dla szacunku kosztów (ta sama formuła co w Middlemanie: współczynnik skali = 1)
REFERENCE_POPULATION = 5000
REFERENCE_SENIOR_PERCENT = 20


class ComparisonItem(BaseModel):
    id: str
    title: str
    tagline: str
    category: str
    category_label: str
    problem_statement: Optional[str] = None
    target_groups: List[str]
    budget_bracket: Optional[str] = None
    setup_cost_pln: Optional[int] = None
    monthly_cost_pln: Optional[int] = None
    staff_needs: Optional[str] = None
    readiness_level: Optional[str] = None
    origin_poviat: Optional[str] = None
    average_rating: Optional[float] = None
    ratings_count: int = 0


class ComparisonResponse(BaseModel):
    items: List[ComparisonItem]
    missing_ids: List[str]
    cost_basis: str


@router.get("/knowledge/compare", response_model=ComparisonResponse)
async def compare_innovations(
    ids: str = Query(..., description="Identyfikatory innowacji rozdzielone przecinkami (2–3)."),
    db: AsyncSession = Depends(get_db),
):
    """Porównanie innowacji dla rady gminy: problem, odbiorcy, koszt, kadry, gotowość, gdzie sprawdzona, oceny."""
    wanted: List[str] = []
    for raw in ids.split(","):
        value = raw.strip()
        if value and value not in wanted:
            wanted.append(value)
    if not wanted:
        raise HTTPException(status_code=422, detail="Podaj co najmniej jedną innowację do porównania.")
    if len(wanted) > MAX_COMPARE:
        raise HTTPException(status_code=422, detail=f"Porównać można najwyżej {MAX_COMPARE} innowacje naraz.")

    items: List[ComparisonItem] = []
    missing: List[str] = []
    for inn_id in wanted:
        inn = await db.get(Innovation, inn_id)
        if not inn or not inn.is_published:
            missing.append(inn_id)
            continue
        avg, count = (await db.execute(
            select(func.avg(InnovationRating.rating), func.count(InnovationRating.id))
            .where(InnovationRating.innovation_id == inn.id)
        )).one()
        profile = INNOVATION_PROFILES.get(inn.id)
        setup = int(round(profile["base_budget"], -2)) if profile else None
        items.append(ComparisonItem(
            id=inn.id, title=inn.title, tagline=inn.tagline, category=inn.category,
            category_label=category_label(inn.category), problem_statement=inn.problem_statement,
            target_groups=list(inn.target_groups or []), budget_bracket=inn.budget_bracket or None,
            setup_cost_pln=setup, monthly_cost_pln=int(round(setup * 0.12, -1)) if setup else None,
            staff_needs=profile["staff"] if profile else None, readiness_level=inn.readiness_level or None,
            origin_poviat=inn.origin_poviat, average_rating=round(float(avg), 1) if avg is not None else None,
            ratings_count=count or 0,
        ))
    return ComparisonResponse(
        items=items,
        missing_ids=missing,
        cost_basis=(f"Szacunek dla gminy ok. {format_pl_number(REFERENCE_POPULATION)} mieszkańców, "
                    f"w tym {REFERENCE_SENIOR_PERCENT}% seniorów (ta sama metoda co w Middlemanie). "
                    "Koszt dla Twojej gminy policzy pakiet wdrożeniowy."),
    )
