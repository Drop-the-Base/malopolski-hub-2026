import asyncio
import logging
import re
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.constants import category_label, powiat_locative, strip_diacritics
from app.models.innovation import Innovation
from app.models.problem_report import ProblemReport
from app.schemas.matchmaking_schema import MatchmakingRequest, MatchmakingResponse, InnovationMatchItem
from app.services.pii_filter import anonymize_text
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)

# Pojęcia (potrzeby) rozpoznawane w zgłoszeniach i opisach innowacji.
# Wyzwalacze ASCII porównywane są z tokenami bez polskich znaków (prefiks),
# wyzwalacze z polskimi znakami – z oryginalnym tekstem (np. "lęk" vs "lek(arz)").
CONCEPTS: Dict[str, Dict[str, Any]] = {
    "seniorzy": {
        "label": "osoby starsze",
        "triggers": ["senior", "emeryt", "starsz", "staruszk", "babci", "babc", "dziadk", "dziadek", "geriatr",
                     "elderly", "pensioner"],
        "categories": ["seniorzy", "uslugi_opiekuncze"],
    },
    "samotnosc": {
        "label": "samotność i izolacja",
        "triggers": ["samotn", "osamotn", "izolac", "odizolow", "anonimow", "lonely", "loneliness", "isolat"],
        "categories": ["seniorzy", "integracja", "zdrowie_psychiczne"],
    },
    "zdrowie_psychiczne": {
        "label": "zdrowie psychiczne",
        "triggers": ["psych", "depres", "lęk", "stres", "emocj", "kryzys", "samobój", "samoboj",
                     "anxiety", "mental", "depress"],
        "categories": ["zdrowie_psychiczne"],
    },
    "mlodziez": {
        "label": "dzieci i młodzież",
        "triggers": ["mlodzie", "nastolat", "nastoletn", "uczni", "uczen", "szkol", "szkoł", "dziec", "dzieck",
                     "student", "youth", "teen", "child"],
        "categories": ["zdrowie_psychiczne", "edukacja", "usamodzielnienie"],
    },
    "bariery_w_domu": {
        "label": "bariery w mieszkaniu i higiena",
        "triggers": ["lazien", "wann", "prysznic", "schod", "podjazd", "progi", "progow", "bezprog", "upad", "toalet",
                     "kapiel", "higien", "mieszkani", "bathroom", "stairs"],
        "categories": ["dostepnosc"],
    },
    "niepelnosprawnosc": {
        "label": "niepełnosprawność",
        "triggers": ["niepelnospr", "ozn", "udar", "afaz", "autyz", "spektrum", "niewidom", "niedowid",
                     "nieslysz", "gluch", "wozek", "wozk", "disab", "wheelchair"],
        "categories": ["dostepnosc", "edukacja"],
    },
    "komunikacja_urzad": {
        "label": "obsługa w urzędzie i komunikacja",
        "triggers": ["urzed", "urzad", "aac", "piktogram", "formalnos", "komunikac werbal"],
        "categories": ["dostepnosc"],
    },
    "transport": {
        "label": "dojazd i wykluczenie transportowe",
        "triggers": ["autobus", "dojazd", "dojecha", "dojezd", "busem", "bus", "transport", "odciet", "kursuj",
                     "samochod", "pojazd", "lekarz", "przychodn", "felczer", "apteki", "apteka", "doctor"],
        "categories": ["seniorzy"],
    },
    "wies": {
        "label": "obszary wiejskie",
        "triggers": ["wies", "wsi", "wiejsk", "solectw", "solty", "gorsk", "oddalon", "odleg", "village", "rural"],
        "categories": ["seniorzy", "integracja"],
    },
    "cyfrowe": {
        "label": "wykluczenie cyfrowe",
        "triggers": ["cyfrow", "internet", "komputer", "smartfon", "aplikac", "recept", "bankowo", "online",
                     "oszust", "digital", "phone"],
        "categories": ["wykluczenie_cyfrowe"],
    },
    "opieka": {
        "label": "opieka i wytchnienie dla opiekunów",
        "triggers": ["opiek", "wytchnien", "alzheimer", "demencj", "otepien", "lezac", "niesamodziel",
                     "zalezn", "pielegn", "hospic", "caregiv"],
        "categories": ["uslugi_opiekuncze", "dostepnosc"],
    },
    "integracja": {
        "label": "integracja sąsiedzka",
        "triggers": ["integrac", "sasiedz", "sasiad", "wspolnot", "zywnos", "wolontar", "miedzypokolen",
                     "neighbo", "community"],
        "categories": ["integracja"],
    },
    "usamodzielnienie": {
        "label": "usamodzielnienie i praca",
        "triggers": ["usamodziel", "piecz", "wychowank", "zatrudn", "bezrobot", "pracy", "praca", "doroslos",
                     "budzet domow", "job"],
        "categories": ["usamodzielnienie"],
    },
    "sensoryka": {
        "label": "rozwój i integracja sensoryczna",
        "triggers": ["sensory", "adhd", "przedszkol", "wyciszen", "rehabilit", "logoped"],
        "categories": ["edukacja"],
    },
}

AGE_REGEX = re.compile(r"\b([6-9]\d|1[01]\d)\s*-?\s*(?:letni|letnia|lat|latk)")

MIN_RELEVANCE = 0.35


def _tokens_with_original(text: str) -> List[Tuple[str, str]]:
    lower = text.lower()
    raw_tokens = re.findall(r"[a-ząćęłńóśźż0-9]+", lower)
    return [(tok, strip_diacritics(tok)) for tok in raw_tokens]


def detect_concepts(text: str) -> List[str]:
    """Zwraca listę kluczy pojęć wykrytych w tekście (w kolejności definicji)."""
    tokens = _tokens_with_original(text)
    found: List[str] = []
    for key, concept in CONCEPTS.items():
        for trig in concept["triggers"]:
            ascii_trigger = strip_diacritics(trig) == trig
            if " " in trig:
                haystack = strip_diacritics(text.lower()) if ascii_trigger else text.lower()
                hit = trig in haystack
            elif ascii_trigger:
                hit = any(norm.startswith(trig) for _, norm in tokens)
            else:
                hit = any(orig.startswith(trig) for orig, _ in tokens)
            if hit:
                found.append(key)
                break
    if "seniorzy" not in found and AGE_REGEX.search(text.lower()):
        found.insert(0, "seniorzy")
    return found


def concept_labels(keys: List[str]) -> List[str]:
    return [CONCEPTS[k]["label"] for k in keys if k in CONCEPTS]


def _innovation_concept_weights(meta: Dict[str, Any]) -> Dict[str, float]:
    primary_text = " ".join([
        meta["title"], meta["tagline"], " ".join(meta.get("target_groups") or []), category_label(meta["category"])
    ])
    weights = {k: 1.0 for k in detect_concepts(primary_text)}
    for k in detect_concepts(meta.get("full_description", "")):
        weights.setdefault(k, 0.5)
    return weights


async def populate_vector_store_if_needed(db: AsyncSession):
    """Indeksuje opublikowane innowacje (leniwie, po starcie lub po zmianie katalogu)."""
    if vector_store.documents:
        return
    result = await db.execute(select(Innovation).where(Innovation.is_published == True))
    for inn in result.scalars().all():
        content = f"{inn.title} {inn.title} {inn.tagline} {inn.full_description} {' '.join(inn.target_groups or [])}"
        meta = {
            "id": inn.id,
            "title": inn.title,
            "tagline": inn.tagline,
            "category": inn.category,
            "target_groups": inn.target_groups or [],
            "full_description": inn.full_description,
            "readiness_level": inn.readiness_level,
            "budget_bracket": inn.budget_bracket,
            "etr_summary": inn.etr_summary,
            "video_url": inn.video_url,
            "handbook_url": inn.handbook_url,
        }
        meta["concepts"] = _innovation_concept_weights(meta)
        vector_store.add_document(doc_id=inn.id, content=content, metadata=meta)


def rank_innovations(text: str, category: Optional[str] = None, limit: int = 4) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Ranking hybrydowy: pokrycie rozpoznanych potrzeb (60%) + podobieństwo leksykalne TF-IDF (30%)
    + premia za zgodną kategorię. Wyniki poniżej progu trafności są odrzucane.
    Zwraca (lista trafień posortowana malejąco, wykryte pojęcia zapytania).
    """
    query_concepts = detect_concepts(text)
    sims, shared_terms = vector_store.similarity(text)
    related_categories = {c for k in query_concepts for c in CONCEPTS[k]["categories"]}

    ranked: List[Dict[str, Any]] = []
    for doc_id, doc in vector_store.documents.items():
        meta = doc["metadata"]
        if category and meta["category"] != category:
            continue
        inn_concepts: Dict[str, float] = meta["concepts"]
        shared = [k for k in query_concepts if k in inn_concepts]
        cos = sims.get(doc_id, 0.0)
        lexical = min(1.0, cos / 0.35)

        if query_concepts:
            coverage = sum(inn_concepts[k] for k in shared) / len(query_concepts)
            score = 0.6 * coverage + 0.3 * lexical
            if meta["category"] in related_categories:
                score += 0.08
        else:
            coverage = 0.0
            score = 0.75 * lexical

        if score < MIN_RELEVANCE or (not shared and cos < 0.12):
            continue
        ranked.append({
            "id": doc_id,
            "meta": meta,
            "score": round(min(0.97, score), 2),
            "shared_concepts": shared,
            "shared_terms": shared_terms.get(doc_id, []),
        })

    ranked.sort(key=lambda r: r["score"], reverse=True)
    return ranked[:limit], query_concepts


def generate_why_matched(meta: Dict[str, Any], shared_concepts: List[str]) -> str:
    """Uzasadnienie oparte na faktycznie dopasowanych potrzebach i grupach docelowych innowacji."""
    groups = ", ".join((meta.get("target_groups") or [])[:3])
    tagline = meta["tagline"][0].lower() + meta["tagline"][1:] if meta.get("tagline") else ""
    if shared_concepts:
        needs = ", ".join(concept_labels(shared_concepts))
        return (
            f"Zgłoszenie dotyczy obszarów: {needs} – a '{meta['title']}' odpowiada właśnie na nie ({tagline}). "
            f"Rozwiązanie jest skierowane do grup: {groups}."
        )
    return (
        f"Opis zgłoszenia jest zbieżny słownikowo z innowacją '{meta['title']}' ({tagline}). "
        f"Grupy docelowe: {groups}. Zweryfikuj dopasowanie z mentorem ROPS."
    )


async def _trend_alert(db: AsyncSession, powiat: Optional[str], category: Optional[str]) -> Optional[str]:
    if not powiat or not category:
        return None
    now = datetime.utcnow()
    base = select(func.count(ProblemReport.id)).where(
        ProblemReport.powiat == powiat, ProblemReport.category == category
    )
    recent = (await db.execute(base.where(ProblemReport.created_at >= now - timedelta(days=90)))).scalar() or 0
    previous = (await db.execute(base.where(
        ProblemReport.created_at < now - timedelta(days=90),
        ProblemReport.created_at >= now - timedelta(days=180)
    ))).scalar() or 0
    if recent < 2:
        return None
    msg = (f"{powiat_locative(powiat).capitalize()} w ostatnich 90 dniach zarejestrowano {recent} zgłoszeń "
           f"z obszaru '{category_label(category)}'")
    if previous:
        change = round((recent - previous) / previous * 100)
        msg += f" ({'+' if change >= 0 else ''}{change}% względem poprzedniego kwartału)"
    return msg + "."


async def process_matchmaking(req: MatchmakingRequest, db: AsyncSession) -> MatchmakingResponse:
    # 1. Anonimizacja PII – do indeksu, bazy i LLM trafia wyłącznie tekst oczyszczony
    clean_text = anonymize_text(req.problem_description)

    # 2. Indeks innowacji
    await populate_vector_store_if_needed(db)

    # 3. Ranking z progiem trafności
    ranked, query_concepts = rank_innovations(clean_text, req.category, req.limit)
    detected_labels = concept_labels(query_concepts) or ["nie rozpoznano konkretnej potrzeby"]

    # Kategoria zgłoszenia do analityki
    if req.category:
        report_category = req.category
    elif ranked:
        report_category = ranked[0]["meta"]["category"]
    elif query_concepts:
        report_category = CONCEPTS[query_concepts[0]]["categories"][0]
    else:
        report_category = None

    # 4. Uzasadnienia: LLM (jeśli skonfigurowany) równolegle z syntezą, inaczej szablon z faktycznych dopasowań
    from app.services.groq_client import generate_ceneo_match_synthesis, generate_match_justifications

    template_why = {r["id"]: generate_why_matched(r["meta"], r["shared_concepts"]) for r in ranked}
    matched_dicts = [
        {"title": r["meta"]["title"], "category": category_label(r["meta"]["category"]), "why_matched": template_why[r["id"]]}
        for r in ranked
    ]
    if ranked:
        llm_why, synthesis = await asyncio.gather(
            generate_match_justifications(clean_text, [r["meta"] for r in ranked]),
            generate_ceneo_match_synthesis(clean_text, req.powiat, matched_dicts),
        )
    else:
        llm_why, synthesis = {}, None

    matches = [
        InnovationMatchItem(
            innovation_id=r["id"],
            title=r["meta"]["title"],
            tagline=r["meta"]["tagline"],
            match_score=r["score"],
            why_matched=llm_why.get(r["id"]) or template_why[r["id"]],
            readiness_level=r["meta"].get("readiness_level") or "Brak danych",
            category=r["meta"]["category"],
            category_label=category_label(r["meta"]["category"]),
            target_groups=r["meta"].get("target_groups", []),
            matched_needs=concept_labels(r["shared_concepts"]),
            etr_summary=r["meta"].get("etr_summary"),
            video_url=r["meta"].get("video_url"),
            handbook_url=r["meta"].get("handbook_url"),
        )
        for r in ranked
    ]

    # 5. Zapis zgłoszenia (tylko tekst zanonimizowany) do analityki trendów
    db.add(ProblemReport(
        id=f"prob-{uuid.uuid4().hex[:8]}",
        title=clean_text[:80],
        raw_text=clean_text,
        clean_text=clean_text,
        category=report_category,
        powiat=req.powiat,
        reporter_type="mieszkaniec",
        matched_innovations=[m.innovation_id for m in matches],
        status="matched"
    ))
    await db.commit()

    similar_q = select(func.count(ProblemReport.id))
    if report_category:
        similar_q = similar_q.where(ProblemReport.category == report_category)
    similar_cases = max(0, ((await db.execute(similar_q)).scalar() or 0) - 1) if report_category else 0

    trend_alert = await _trend_alert(db, req.powiat, report_category)

    if synthesis is None:
        loc = powiat_locative(req.powiat)
        synthesis = {
            "ceneo_intro": (
                f"Nie znaleźliśmy w katalogu ROPS innowacji, która wystarczająco pasuje do tego opisu ({loc}). "
                "To cenna informacja – zgłoszona potrzeba może wskazywać lukę, której nikt jeszcze nie rozwiązał."
            ),
            "ceneo_bundle_rationale": (
                "Zamiast pokazywać przypadkowe wyniki, proponujemy przekazać problem do ROPS Kraków albo opisać "
                "własny pomysł na jego rozwiązanie w Kreatorze Pomysłów."
            ),
            "action_steps": [
                "Krok 1: Doprecyzuj opis – kogo dotyczy problem, gdzie i czego brakuje.",
                "Krok 2: Zgłoś problem do Rejestru Wyzwań, aby trafił do analizy ROPS.",
                "Krok 3: Masz pomysł na rozwiązanie? Złóż fiszkę w Kreatorze Pomysłów.",
            ],
        }

    return MatchmakingResponse(
        clean_query=clean_text,
        detected_topics=detected_labels,
        powiat=req.powiat,
        matches=matches,
        no_match=not matches,
        similar_cases_count=similar_cases,
        trend_alert=trend_alert,
        ceneo_intro=synthesis["ceneo_intro"],
        ceneo_bundle_rationale=synthesis["ceneo_bundle_rationale"],
        action_steps=synthesis["action_steps"],
        ai_generated=bool(llm_why),
    )
