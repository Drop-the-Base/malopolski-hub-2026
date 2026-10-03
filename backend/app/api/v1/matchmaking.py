from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.matchmaking_schema import MatchmakingRequest, MatchmakingResponse
from app.services.matchmaking_service import process_matchmaking

router = APIRouter()

@router.post("/matchmaking", response_model=MatchmakingResponse, tags=["Moduł I: Matchmaking Społeczny"])
async def match_problem(req: MatchmakingRequest, db: AsyncSession = Depends(get_db)):
    """
    Kojarzenie zgłaszanych problemów społecznych ze sprawdzonymi innowacjami.
    Ranking: pokrycie rozpoznanych potrzeb + podobieństwo TF-IDF + zgodność kategorii, z progiem trafności
    (brak dopasowania zwraca `no_match=true` zamiast przypadkowych wyników). Tekst jest anonimizowany przed
    zapisem i wysłaniem do LLM; uzasadnienia generuje LLM (Groq) lub szablon oparty na dopasowanych potrzebach.
    """
    return await process_matchmaking(req, db)
