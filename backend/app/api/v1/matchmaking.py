from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.matchmaking_schema import MatchmakingRequest, MatchmakingResponse
from app.services.matchmaking_service import process_matchmaking

router = APIRouter()

@router.post("/matchmaking", response_model=MatchmakingResponse, tags=["Moduł I: Matchmaking Społeczny"])
async def match_problem(req: MatchmakingRequest, db: AsyncSession = Depends(get_db)):
    """
    [OBLIGATORYJNA FUNKCJONALNOŚĆ WYMAGANA PRZEZ ROPS KRAKÓW]
    Inteligentny mechanizm łączący zgłaszane problemy społeczne ze sprawdzonymi innowacjami.
    Wykorzystuje wyszukiwanie hybrydowe (wektorowe + słowa kluczowe), filtr PII
    oraz generuje 2-zdaniowe uzasadnienie dopasowania.
    """
    try:
        return await process_matchmaking(req, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd podczas kojarzenia potrzeb: {str(e)}")
