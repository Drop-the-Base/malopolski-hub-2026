"""
Otwarte API (G9) – publiczne, tylko do odczytu, ze stronicowaniem i CORS dla dowolnej domeny.
Udostępnia katalog innowacji, wyzwania powiatów i zagregowane potrzeby (bez danych osobowych) w JSON i CSV.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import normalize_category
from app.core.database import get_db
from app.services.export_service import NEEDS_HEADER, aggregate_needs, csv_response, needs_rows, paginate, to_csv
from app.services.knowledge_service import get_innovations, get_regional_challenges

OPEN_PREFIX = "/api/v1/open"
TAG = "Otwarte dane (API integracyjne)"
router = APIRouter(prefix="/open", tags=[TAG])

LICENSE_NOTE = (
    "Prototyp HackYeah 2026 – dane demonstracyjne (katalog innowacji ROPS w wersji przykładowej). "
    "Zgłoszenia są udostępniane wyłącznie w postaci zagregowanych liczb, bez treści i danych osobowych."
)
CSV_RESPONSES: Dict[int | str, Dict[str, Any]] = {200: {"content": {"text/csv": {}}}}

OPEN_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
}


async def open_data_cors(request: Request, call_next):
    """
    Otwarte dane można pobierać z dowolnej strony (Access-Control-Allow-Origin: *), ale bez ciasteczek i nagłówków
    autoryzacji – reszta API pozostaje ograniczona do zaufanych domen (CORS_ORIGINS).
    """
    if not request.url.path.startswith(OPEN_PREFIX):
        return await call_next(request)
    if request.method == "OPTIONS":
        return Response(status_code=204, headers=OPEN_CORS_HEADERS)
    response = await call_next(request)
    for name, value in OPEN_CORS_HEADERS.items():
        response.headers[name] = value
    if "access-control-allow-credentials" in response.headers:
        del response.headers["access-control-allow-credentials"]
    response.headers.setdefault("Cache-Control", "public, max-age=300")
    return response


def _category(category: Optional[str]) -> Optional[str]:
    try:
        return normalize_category(category)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


async def _innovation_items(db: AsyncSession, category: Optional[str]) -> List[Dict[str, Any]]:
    items = await get_innovations(db, category=_category(category))
    return [
        {
            "id": i.id,
            "title": i.title,
            "tagline": i.tagline,
            "category": i.category,
            "category_label": i.category_label,
            "target_groups": i.target_groups,
            "description": i.full_description,
            "easy_to_read_summary": i.etr_summary,
            "readiness_level": i.readiness_level,
            "budget_bracket": i.budget_bracket,
            "origin_powiat": i.origin_poviat,
            "video_url": i.video_url,
            "handbook_url": i.handbook_url,
            "page_path": f"/baza-wiedzy/{i.id}",
            "created_at": i.created_at,
        }
        for i in items
    ]


@router.get("")
async def open_index():
    """Spis otwartych zasobów."""
    base = OPEN_PREFIX
    return {
        "name": "MHIS – otwarte dane",
        "version": "1",
        "note": LICENSE_NOTE,
        "resources": {
            "innovations": {"json": f"{base}/innovations", "csv": f"{base}/innovations.csv",
                            "params": ["page", "page_size (1–100)", "category"]},
            "challenges": {"json": f"{base}/challenges", "csv": f"{base}/challenges.csv",
                           "params": ["page", "page_size (1–100)"]},
            "needs": {"json": f"{base}/needs", "csv": f"{base}/needs.csv", "params": ["page", "page_size (1–100)"]},
        },
        "docs": "/docs#/" + TAG.replace(" ", "%20"),
    }


@router.get("/innovations")
async def open_innovations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, description="Filtr kategorii, np. seniorzy, dostepnosc"),
    db: AsyncSession = Depends(get_db),
):
    """Opublikowane innowacje z katalogu ROPS (stronicowane)."""
    items = await _innovation_items(db, category)
    return {**paginate(items, page, page_size, f"{OPEN_PREFIX}/innovations",
                       f"category={category}" if category else None), "note": LICENSE_NOTE}


@router.get("/innovations.csv", response_class=Response, responses=CSV_RESPONSES)
async def open_innovations_csv(category: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    items = await _innovation_items(db, category)
    header = ["id", "tytul", "haslo", "kategoria", "kategoria_nazwa", "grupy_docelowe", "opis", "streszczenie_etr",
              "gotowosc", "budzet", "powiat_pochodzenia", "film", "podrecznik", "strona"]
    rows = [[i["id"], i["title"], i["tagline"], i["category"], i["category_label"], i["target_groups"],
             i["description"], i["easy_to_read_summary"], i["readiness_level"], i["budget_bracket"],
             i["origin_powiat"], i["video_url"], i["handbook_url"], i["page_path"]] for i in items]
    return csv_response(to_csv(header, rows), "mhis-innowacje", public=True)


@router.get("/challenges")
async def open_challenges(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Wyzwania i wskaźniki 22 powiatów Małopolski (Mapa Wyzwań)."""
    items = [c.model_dump() for c in await get_regional_challenges(db)]
    return {**paginate(items, page, page_size, f"{OPEN_PREFIX}/challenges"), "note": LICENSE_NOTE}


@router.get("/challenges.csv", response_class=Response, responses=CSV_RESPONSES)
async def open_challenges_csv(db: AsyncSession = Depends(get_db)):
    items = await get_regional_challenges(db)
    header = ["kod_powiatu", "powiat", "ludnosc", "seniorzy_proc", "mlodziez_proc", "trend_demograficzny",
              "zgloszone_problemy", "aktywne_innowacje", "kluczowe_wyzwanie"]
    rows = [[c.powiat_code, c.powiat_name, c.population, c.senior_share_pct, c.youth_share_pct, c.demographic_trend,
             c.reported_problems_count, c.active_innovations_count, c.key_social_challenge] for c in items]
    return csv_response(to_csv(header, rows), "mhis-wyzwania-powiatow", public=True)


@router.get("/needs")
async def open_needs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Zagregowane potrzeby: liczba zgłoszeń per powiat i obszar (bez treści zgłoszeń i danych osobowych)."""
    items = await aggregate_needs(db)
    return {**paginate(items, page, page_size, f"{OPEN_PREFIX}/needs"), "note": LICENSE_NOTE}


@router.get("/needs.csv", response_class=Response, responses=CSV_RESPONSES)
async def open_needs_csv(db: AsyncSession = Depends(get_db)):
    return csv_response(to_csv(NEEDS_HEADER, needs_rows(await aggregate_needs(db))), "mhis-potrzeby", public=True)
