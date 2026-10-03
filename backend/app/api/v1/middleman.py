from fastapi import APIRouter
from app.schemas.middleman_schema import AdaptationRequest, AdaptationResponse, ETRRequest, ETRResponse
from app.schemas.chat_schema import MiddlemanChatRequest, MiddlemanChatResponse
from app.services.middleman_service import adapt_innovation_for_municipality
from app.services.etr_simplifier import simplify_to_etr
from app.services.groq_client import middleman_consultant_chat

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

@router.post("/middleman/chat", response_model=MiddlemanChatResponse, tags=["Moduł VII: Middleman Innowacji dla JST"])
async def chat_with_jst_consultant(req: MiddlemanChatRequest):
    """
    Interaktywny Czat AI z Doradcą Samorządowym ROPS Kraków ds. Wdrożeń.
    Wspiera wójtów, burmistrzów i kadrę CUS/OPS w argumentacji dla Rady Gminy,
    montażu finansowym (FEM 2021-2027) i kwestiach kadrowo-prawnych.
    """
    context = {
        "innovation_id": req.innovation_id,
        "municipality_name": req.municipality_name,
        "powiat": req.powiat,
        "population": req.population,
        "senior_percentage": req.senior_percentage,
        "has_cus": req.has_cus,
        "annual_budget_pln": req.annual_budget_pln,
        "blueprint_summary": req.blueprint_summary
    }
    messages_payload = [{"role": m.role, "content": m.content} for m in req.messages]
    result = await middleman_consultant_chat(messages_payload, context)
    return MiddlemanChatResponse(**result)

@router.post("/tools/etr-simplify", response_model=ETRResponse, tags=["Dostępność WCAG & ETR"])
async def simplify_text_etr(req: ETRRequest):
    """
    Narzędzie transformacji tekstu urzędowego na Standard Łatwego Tekstu do Czytania (ETR).
    Dedykowane seniorom oraz osobom z niepełnosprawnościami.
    """
    return simplify_to_etr(req.source_text)

