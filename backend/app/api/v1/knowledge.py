import re
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_admin
from app.models.innovation import Innovation
from app.schemas.innovation_schema import InnovationDetail, InnovationUpsert, RegionalChallengeSummary, EducationalMaterial
from app.services.knowledge_service import (
    get_innovations,
    get_innovation_by_id,
    get_regional_challenges,
    get_educational_materials
)
from app.services.vector_store import vector_store

router = APIRouter()

@router.get("/knowledge/innovations", response_model=List[InnovationDetail], tags=["Moduł II: Zasobnik Wiedzy"])
async def list_innovations(
    category: Optional[str] = Query(None, description="Filtruj po kategorii (seniorzy, dostepnosc, zdrowie_psychiczne, itp.)"),
    target_group: Optional[str] = Query(None, description="Filtruj po grupie docelowej"),
    search: Optional[str] = Query(None, max_length=200, description="Szukaj w tytule, opisie i grupach (bez względu na polskie znaki)"),
    db: AsyncSession = Depends(get_db)
):
    """Katalog sprawdzonych innowacji społecznych ROPS Kraków."""
    return await get_innovations(db, category=category, target_group=target_group, search=search)

@router.get("/knowledge/innovations/{inn_id}", response_model=InnovationDetail, tags=["Moduł II: Zasobnik Wiedzy"])
async def get_single_innovation(inn_id: str, db: AsyncSession = Depends(get_db)):
    """Karta pojedynczej innowacji z wersją ETR."""
    item = await get_innovation_by_id(db, inn_id)
    if not item:
        raise HTTPException(status_code=404, detail="Innowacja o podanym ID nie została odnaleziona.")
    return item

@router.post("/knowledge/innovations", response_model=InnovationDetail, status_code=201, tags=["Moduł VI: Panel Administratora"])
async def create_innovation(req: InnovationUpsert, db: AsyncSession = Depends(get_db), _: str = Depends(require_admin)):
    """Dodanie innowacji do Biblioteki (koordynator ROPS)."""
    ids = (await db.execute(select(Innovation.id))).scalars().all()
    numbers = [int(m.group(1)) for i in ids if (m := re.fullmatch(r"rops-inn-(\d+)", i))]
    new_id = f"rops-inn-{(max(numbers) + 1) if numbers else 1:03d}"
    db.add(Innovation(id=new_id, **req.model_dump()))
    await db.commit()
    vector_store.clear()  # indeks zostanie przebudowany przy kolejnym zapytaniu
    return await get_innovation_by_id(db, new_id)

@router.put("/knowledge/innovations/{inn_id}", response_model=InnovationDetail, tags=["Moduł VI: Panel Administratora"])
async def update_innovation(inn_id: str, req: InnovationUpsert, db: AsyncSession = Depends(get_db), _: str = Depends(require_admin)):
    """Aktualizacja karty innowacji (np. nowy podręcznik, film, wersja ETR)."""
    item = await db.get(Innovation, inn_id)
    if not item:
        raise HTTPException(status_code=404, detail="Innowacja o podanym ID nie została odnaleziona.")
    for key, value in req.model_dump().items():
        setattr(item, key, value)
    await db.commit()
    vector_store.clear()
    return await get_innovation_by_id(db, inn_id)

@router.delete("/knowledge/innovations/{inn_id}", tags=["Moduł VI: Panel Administratora"])
async def unpublish_innovation(inn_id: str, db: AsyncSession = Depends(get_db), _: str = Depends(require_admin)):
    """Wycofanie innowacji z publikacji (dane pozostają w bazie)."""
    item = await db.get(Innovation, inn_id)
    if not item:
        raise HTTPException(status_code=404, detail="Innowacja o podanym ID nie została odnaleziona.")
    item.is_published = False
    await db.commit()
    vector_store.clear()
    return {"status": "unpublished", "id": inn_id}

@router.get("/knowledge/challenges", response_model=List[RegionalChallengeSummary], tags=["Moduł II: Zasobnik Wiedzy"])
async def list_challenges(db: AsyncSession = Depends(get_db)):
    """Mapa Wyzwań Społecznych dla 22 powiatów Małopolski."""
    return await get_regional_challenges(db)

@router.get("/knowledge/materials", response_model=List[EducationalMaterial], tags=["Moduł II: Zasobnik Wiedzy"])
async def list_materials():
    """Materiały edukacyjne i narzędzia metodyczne."""
    return get_educational_materials()
