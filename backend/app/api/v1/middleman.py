from fastapi import APIRouter
from app.schemas.middleman_schema import AdaptationRequest, AdaptationResponse, ETRRequest, ETRResponse
from app.services.middleman_service import adapt_innovation_for_municipality
from app.services.etr_simplifier import simplify_to_etr

router = APIRouter()

@router.post("/middleman/adapt", response_model=AdaptationResponse, tags=["Moduł VII: Middleman Innowacji dla JST"])
async def adapt_service_for_jst(req: AdaptationRequest):
    """
    [KILLER FEATURE DLA JEDNOSTEK SAMORZĄDU TERYTORIALNEGO]
    Asystent AI dostosowujący sprawdzoną innowację ROPS do specyfiki małopolskiej gminy.
    Generuje kompletny pakiet wdrożeniowy (Service Blueprint), kosztorys, wymagania kadrowe
    oraz gotowy projekt Uchwały Rady Gminy.
    """
    return adapt_innovation_for_municipality(req)

@router.post("/tools/etr-simplify", response_model=ETRResponse, tags=["Dostępność WCAG & ETR"])
async def simplify_text_etr(req: ETRRequest):
    """
    Narzędzie transformacji tekstu urzędowego na Standard Łatwego Tekstu do Czytania (ETR).
    Dedykowane seniorom oraz osobom z niepełnosprawnościami.
    """
    return simplify_to_etr(req.source_text)
