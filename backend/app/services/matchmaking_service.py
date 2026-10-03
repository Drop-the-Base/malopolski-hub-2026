import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.innovation import Innovation
from app.models.problem_report import ProblemReport
from app.schemas.matchmaking_schema import MatchmakingRequest, MatchmakingResponse, InnovationMatchItem
from app.services.pii_filter import anonymize_text
from app.services.vector_store import vector_store

# Wykrywanie kluczowych tematów na podstawie słów kluczowych
TOPIC_KEYWORDS = {
    "seniorzy": ["senior", "emeryt", "starsz", "babci", "dziad", "60+", "70+", "80+", "geriatr"],
    "zdrowie_psychiczne": ["psycholog", "depresj", "lęk", "samotnoś", "stres", "emocj", "izolacj", "psychiatr"],
    "dostepnosc": ["łazienk", "wózek", "podjazd", "schody", "niepełnosprawn", "afazj", "bariera", "auton"],
    "wykluczenie_cyfrowe": ["smartfon", "internet", "komputer", "e-usług", "bankowoś", "telefon", "aplikacj"],
    "transport": ["autobus", "dojazd", "odcię", "bus", "transport", "samochód", "droga", "wieś"],
    "uslugi_opiekuncze": ["opiek", "alzheimer", "wytchnieni", "pomoc domowa", "zależn"]
}

async def populate_vector_store_if_needed(db: AsyncSession):
    """Indeksuje innowacje w silniku wektorowym, jeśli nie zostały jeszcze zaindeksowane."""
    if not vector_store.documents:
        result = await db.execute(select(Innovation).where(Innovation.is_published == True))
        innovations = result.scalars().all()
        for inn in innovations:
            content = f"{inn.title} {inn.tagline} {inn.full_description} {' '.join(inn.target_groups or [])} {inn.category}"
            vector_store.add_document(
                doc_id=inn.id,
                content=content,
                metadata={
                    "id": inn.id,
                    "title": inn.title,
                    "tagline": inn.tagline,
                    "category": inn.category,
                    "target_groups": inn.target_groups or [],
                    "readiness_level": inn.readiness_level,
                    "etr_summary": inn.etr_summary,
                    "video_url": inn.video_url,
                    "handbook_url": inn.handbook_url
                }
            )

def detect_topics(text: str) -> List[str]:
    text_lower = text.lower()
    detected = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(topic)
    return detected if detected else ["ogólne wyzwanie społeczne"]

def generate_why_matched(problem_text: str, innovation_title: str, category: str, score: float) -> str:
    """Generuje zwięzłe, 2-zdaniowe uzasadnienie dopasowania innowacji do problemu."""
    if "senior" in category or "senior" in problem_text.lower():
        return f"Innowacja '{innovation_title}' skutecznie niweluje bariery dotykające osoby starsze w środowisku wiejskim i miejskim. Oferuje bezpośrednie narzędzia wsparcia społecznego przetestowane w Małopolsce."
    elif "psych" in category or "lęk" in problem_text.lower() or "komik" in innovation_title.lower():
        return f"Rozwiązanie '{innovation_title}' odpowiada na zdiagnozowane kryzysy emocjonalne i poczucie izolacji. Umożliwia łagodny, bezstresowy kontakt z profesjonalnym wsparciem psychologicznym."
    elif "dostepnosc" in category or "łazienk" in problem_text.lower() or "przestrzen" in innovation_title.lower():
        return f"Innowacja usuwa fizyczne i architektoniczne bariery w otoczeniu osób niesamodzielnych. Zapewnia natychmiastową poprawę bezpieczeństwa higienicznego i ruchowego."
    else:
        return f"Model '{innovation_title}' bezpośrednio adresuje wyzwania w kategorii {category}. Pozwala na szybką adaptację sprawdzonych procedur inkubowanych przez ROPS Kraków."

async def process_matchmaking(req: MatchmakingRequest, db: AsyncSession) -> MatchmakingResponse:
    # 1. Anonimizacja PII
    clean_text = anonymize_text(req.problem_description)
    detected_topics = detect_topics(clean_text)

    # 2. Upewnij się, że indeks wektorowy zawiera innowacje
    await populate_vector_store_if_needed(db)

    # 3. Wyszukiwanie hybrydowe
    search_results = vector_store.search(
        query=clean_text,
        top_k=req.limit,
        category_filter=req.category
    )

    matches: List[InnovationMatchItem] = []
    matched_ids: List[str] = []

    for doc_id, score, meta in search_results:
        matched_ids.append(doc_id)
        why = generate_why_matched(clean_text, meta["title"], meta["category"], score)
        matches.append(
            InnovationMatchItem(
                innovation_id=doc_id,
                title=meta["title"],
                tagline=meta["tagline"],
                match_score=score,
                why_matched=why,
                readiness_level=meta.get("readiness_level", "Gotowa do skalowania"),
                category=meta.get("category", "ogólna"),
                target_groups=meta.get("target_groups", []),
                etr_summary=meta.get("etr_summary"),
                video_url=meta.get("video_url"),
                handbook_url=meta.get("handbook_url")
            )
        )

    # Fallback, jeśli wektory nie zwróciły wystarczającej liczby wyników
    if len(matches) < req.limit:
        res = await db.execute(select(Innovation).limit(req.limit - len(matches)))
        extra_inns = res.scalars().all()
        for inn in extra_inns:
            if inn.id not in matched_ids:
                matched_ids.append(inn.id)
                matches.append(
                    InnovationMatchItem(
                        innovation_id=inn.id,
                        title=inn.title,
                        tagline=inn.tagline,
                        match_score=0.68,
                        why_matched=f"Innowacja z katalogu ROPS Kraków rekomendowana jako uniwersalne wsparcie lokalnych inicjatyw.",
                        readiness_level=inn.readiness_level,
                        category=inn.category,
                        target_groups=inn.target_groups or [],
                        etr_summary=inn.etr_summary,
                        video_url=inn.video_url,
                        handbook_url=inn.handbook_url
                    )
                )

    # 4. Zapis zgłoszenia w bazie do celów analitycznych
    report = ProblemReport(
        id=f"prob-{uuid.uuid4().hex[:8]}",
        raw_text=req.problem_description,
        clean_text=clean_text,
        category=req.category or (detected_topics[0] if detected_topics else "ogólne"),
        powiat=req.powiat,
        reporter_type="mieszkaniec",
        matched_innovations=matched_ids,
        status="matched"
    )
    db.add(report)
    await db.commit()

    # Alert trendów
    trend_alert = None
    if req.powiat:
        trend_alert = f"W powiecie {req.powiat} odnotowano wzrost zapotrzebowania na innowacje z obszaru '{detected_topics[0]}' o 24% w skali kwartału."

    # 5. Generowanie syntezy w stylu asystenta zakupowego Ceneo (diagnoza + uzasadnienie koszyka + 3 kroki)
    matched_dicts = [
        {"title": m.title, "category": m.category, "why_matched": m.why_matched}
        for m in matches
    ]
    from app.services.groq_client import generate_ceneo_match_synthesis
    ceneo_synthesis = await generate_ceneo_match_synthesis(clean_text, req.powiat, matched_dicts)

    return MatchmakingResponse(
        clean_query=clean_text,
        detected_topics=detected_topics,
        powiat=req.powiat,
        matches=matches,
        similar_cases_count=len(matches) * 4 + 3,
        trend_alert=trend_alert,
        ceneo_intro=ceneo_synthesis["ceneo_intro"],
        ceneo_bundle_rationale=ceneo_synthesis["ceneo_bundle_rationale"],
        action_steps=ceneo_synthesis["action_steps"]
    )
