from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.innovation_schema import InnovationDetail, RegionalChallengeSummary, EducationalMaterial
from app.services.knowledge_service import (
    get_innovations,
    get_innovation_by_id,
    get_regional_challenges,
    get_educational_materials
)

router = APIRouter()

@router.get("/knowledge/innovations", response_model=List[InnovationDetail], tags=["Moduł II: Zasobnik Wiedzy"])
async def list_innovations(
    category: Optional[str] = Query(None, description="Filtruj po kategorii (seniorzy, dostepnosc, zdrowie_psychiczne, itp.)"),
    target_group: Optional[str] = Query(None, description="Filtruj po grupie docelowej"),
    search: Optional[str] = Query(None, description="Wyszukaj frazę w tytule lub opisie"),
    db: AsyncSession = Depends(get_db)
):
    """Katalog sprawdzonych innowacji społecznych ROPS Kraków."""
    return await get_innovations(db, category=category, target_group=target_group, search=search)

@router.get("/knowledge/innovations/{inn_id}", response_model=InnovationDetail, tags=["Moduł II: Zasobnik Wiedzy"])
async def get_single_innovation(inn_id: str, db: AsyncSession = Depends(get_db)):
    """Karta pojedynczej innowacji z multimediami i wersją ETR."""
    item = await get_innovation_by_id(db, inn_id)
    if not item:
        raise HTTPException(status_code=404, detail="Innowacja o podanym ID nie została odnaleziona.")
    return item

@router.get("/knowledge/challenges", response_model=List[RegionalChallengeSummary], tags=["Moduł II: Zasobnik Wiedzy"])
async def list_challenges(db: AsyncSession = Depends(get_db)):
    """Kondycja Małopolski i Mapa Wyzwań Społecznych dla 22 powiatów regionu."""
    return await get_regional_challenges(db)

@router.get("/knowledge/materials", response_model=List[EducationalMaterial], tags=["Moduł II: Zasobnik Wiedzy"])
async def list_materials():
    """Materiały edukacyjne, podręczniki i szablony Canwy Innowacji ROPS Kraków."""
    return get_educational_materials()
