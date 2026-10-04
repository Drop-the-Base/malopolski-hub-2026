import asyncio
import logging
import math
import re
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.constants import category_label, powiat_label, powiat_locative, strip_diacritics
from app.models.innovation import Innovation
from app.models.problem_report import ProblemReport
from app.schemas.matchmaking_schema import (
    MatchmakingRequest, MatchmakingResponse, InnovationMatchItem, KeywordHighlight, SimilarReportGroup
)
from app.services.pii_filter import anonymize_text
from app.services.vector_store import vector_store, stem, STOPWORDS

logger = logging.getLogger(__name__)

# Pojęcia (potrzeby) rozpoznawane w zgłoszeniach i opisach innowacji.
# Wyzwalacze ASCII porównywane są z tokenami bez polskich znaków (prefiks),
# wyzwalacze z polskimi znakami – z oryginalnym tekstem (np. "lęk" vs "lek(arz)").
CONCEPTS: Dict[str, Dict[str, Any]] = {
    "seniorzy": {
        "label": "osoby starsze",
        "triggers": ["senior", "emeryt", "starsz", "starsi", "staruszk", "babci", "babc", "dziadk", "dziadek", "geriatr",
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
        "triggers": ["opiek", "wytchnien", "wyczerp", "wypalen", "odpoczyn", "zastap", "alzheimer", "demencj", "otepien", "lezac", "niesamodziel",
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

# Pojęcia opisujące KOGO/GDZIE dotyczy problem (kontekst), a nie samą potrzebę. Innowacja pasująca wyłącznie
# kontekstem (np. "dla mieszkańców wsi", gdy problemem jest dojazd do lekarza) dostaje obniżoną ocenę.
CONTEXT_CONCEPTS = {"seniorzy", "mlodziez", "wies", "niepelnosprawnosc"}
CONTEXT_WEIGHT = 0.6
CONTEXT_ONLY_PENALTY = 0.7

# Potrzeby, na które odpowiadają też innowacje z pokrewnego obszaru (samotność <- integracja sąsiedzka)
RELATED_NEEDS: Dict[str, Dict[str, float]] = {
    "samotnosc": {"integracja": 0.6},
}

# "dzieci wyjechały" w opisie problemu seniora nie oznacza potrzeby dzieci i młodzieży
CHILD_WORDS_ONLY = ("dziec", "dzieck")

AGE_REGEX = re.compile(r"\b([6-9]\d|1[01]\d)\s*-?\s*(?:letni|letnia|lat|latk)")

MIN_RELEVANCE = 0.35


_WORD_RE = re.compile(r"[a-ząćęłńóśźż0-9]+")
_LEXICAL_RE = re.compile(r"[a-z0-9]{3,}")

Span = Tuple[int, int]


def _lower_same_length(text: str) -> str:
    """Małe litery z zachowaniem pozycji znaków (potrzebne do podświetlania fragmentów oryginalnego opisu)."""
    lower = text.lower()
    return lower if len(lower) == len(text) else "".join(c.lower() if len(c.lower()) == 1 else c for c in text)


def _word_span(text: str, start: int, end: int) -> Span:
    """Rozszerza dopasowanie do granic całego słowa."""
    while start > 0 and _WORD_RE.match(text[start - 1]):
        start -= 1
    while end < len(text) and _WORD_RE.match(text[end]):
        end += 1
    return start, end


def detect_concepts_with_evidence(text: str) -> Dict[str, List[Span]]:
    """
    Rozpoznaje potrzeby w tekście i zwraca, które słowa (pozycje znaków) o tym zdecydowały.
    Kolejność kluczy = kolejność definicji w CONCEPTS (seniorzy rozpoznani z wieku – na początku).
    """
    lower = _lower_same_length(text)
    ascii_lower = strip_diacritics(lower)
    if len(ascii_lower) != len(lower):  # bezpiecznik – pozycje muszą się zgadzać
        ascii_lower = lower
    words = [(m.start(), m.end()) for m in _WORD_RE.finditer(lower)]

    evidence: Dict[str, List[Span]] = {}
    for key, concept in CONCEPTS.items():
        spans: List[Span] = []
        for trig in concept["triggers"]:
            ascii_trigger = strip_diacritics(trig) == trig
            haystack = ascii_lower if ascii_trigger else lower
            if " " in trig:
                for m in re.finditer(re.escape(trig), haystack):
                    spans.append(_word_span(lower, m.start(), m.end()))
            else:
                spans.extend((a, b) for a, b in words if haystack[a:b].startswith(trig))
        if spans:
            evidence[key] = sorted(set(spans))

    if "seniorzy" not in evidence:
        age = AGE_REGEX.search(lower)
        if age:
            evidence = {"seniorzy": [_word_span(lower, age.start(), age.end())], **evidence}
    if "seniorzy" in evidence and "mlodziez" in evidence and all(
        ascii_lower[a:b].startswith(CHILD_WORDS_ONLY) for a, b in evidence["mlodziez"]
    ):
        del evidence["mlodziez"]
    return evidence


def detect_concepts(text: str) -> List[str]:
    """Zwraca listę kluczy pojęć wykrytych w tekście (w kolejności definicji)."""
    return list(detect_concepts_with_evidence(text).keys())


def lexical_spans(text: str, stems: List[str]) -> List[Span]:
    """Pozycje słów opisu, których rdzeń (jak w indeksie TF-IDF) występuje w podanej liście."""
    wanted = set(stems)
    if not wanted:
        return []
    ascii_lower = strip_diacritics(_lower_same_length(text))
    if len(ascii_lower) != len(text):
        return []
    return [(m.start(), m.end()) for m in _LEXICAL_RE.finditer(ascii_lower)
            if m.group(0) not in STOPWORDS and stem(m.group(0)) in wanted and _is_word(ascii_lower, m)]


def _is_word(text: str, m: "re.Match") -> bool:
    """Token leksykalny musi być całym słowem (nie fragmentem słowa z cyframi/literami po obu stronach)."""
    return (m.start() == 0 or not text[m.start() - 1].isalnum()) and (m.end() == len(text) or not text[m.end()].isalnum())


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
    need_concepts = [k for k in query_concepts if k not in CONTEXT_CONCEPTS]
    query_weights = {k: (CONTEXT_WEIGHT if k in CONTEXT_CONCEPTS else 1.0) for k in query_concepts}
    query_total = sum(query_weights.values())

    ranked: List[Dict[str, Any]] = []
    for doc_id, doc in vector_store.documents.items():
        meta = doc["metadata"]
        if category and meta["category"] != category:
            continue
        inn_concepts: Dict[str, float] = meta["concepts"]
        concept_fit: Dict[str, float] = {}
        for k in query_concepts:
            fit = inn_concepts.get(k, 0.0)
            for related, weight in RELATED_NEEDS.get(k, {}).items():
                fit = max(fit, weight * inn_concepts.get(related, 0.0))
            if fit:
                concept_fit[k] = fit
        shared = list(concept_fit)
        cos = sims.get(doc_id, 0.0)
        lexical = min(1.0, cos / 0.35)

        if query_concepts:
            coverage = sum(query_weights[k] * f for k, f in concept_fit.items()) / query_total
            score = 0.6 * coverage + 0.3 * lexical
            if meta["category"] in related_categories:
                score += 0.08
            # Trafia tylko w kontekst (kogo/gdzie), a nie w samą potrzebę – obniżamy ocenę
            if need_concepts and not any(concept_fit.get(k, 0) >= 0.6 for k in need_concepts):
                score *= CONTEXT_ONLY_PENALTY
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


# Słowa zbyt ogólne, by pokazywać je jako powód dopasowania (choć liczą się w podobieństwie TF-IDF)
GENERIC_STEMS = {
    "potrze", "proble", "pomocy", "pomoc", "brak", "brakuj", "mieszk", "ludzi", "wsparc", "trudno", "rodzin",
    "miejsc", "lokaln", "gminn", "spolec", "dzieci", "czasu", "dostep", "moze", "mozna", "kazdy", "wiele",
    "korzys", "umieja", "potraf",
}

# Ile wcześniejszych zgłoszeń przeglądamy przy szukaniu podobnych (prototyp – bez indeksu pełnotekstowego)
SIMILAR_SCAN_LIMIT = 1000
SIMILAR_GROUPS_LIMIT = 6


def _distinctive_terms(terms: List[str]) -> List[str]:
    """Wspólne rdzenie, które faktycznie coś mówią: nie ogólne i nie występujące w większości katalogu."""
    total = len(vector_store.documents) or 1
    threshold = math.log((total + 1) / (total / 2 + 1)) + 1.0
    return [t for t in terms if t not in GENERIC_STEMS and vector_store.idf.get(t, 0) > threshold]


def _span_text(text: str, spans: List[Span]) -> List[str]:
    """Unikalne słowa (w kolejności występowania w opisie) dla podanych pozycji."""
    seen, words = set(), []
    for a, b in sorted(spans):
        word = text[a:b]
        if word.lower() not in seen:
            seen.add(word.lower())
            words.append(word)
    return words


def build_highlights(
    text: str, evidence: Dict[str, List[Span]], lexical: Dict[Span, str]
) -> List[KeywordHighlight]:
    """Scala pozycje słów kluczowych w rozłączne fragmenty z opisem, dlaczego są ważne."""
    reasons: Dict[Span, List[str]] = {}
    for key, spans in evidence.items():
        for span in spans:
            reasons.setdefault(span, []).append(CONCEPTS[key]["label"])
    for span, title in lexical.items():
        if span not in reasons:
            reasons[span] = [f"słowo występuje w opisie innowacji „{title}”"]
    result: List[KeywordHighlight] = []
    last_end = -1
    for (a, b) in sorted(reasons):
        if a < last_end:  # nakładające się fragmenty – zostawiamy pierwszy
            continue
        result.append(KeywordHighlight(start=a, end=b, text=text[a:b], reasons=reasons[(a, b)]))
        last_end = b
    return result


async def find_similar_reports(
    db: AsyncSession,
    query_concepts: List[str],
    category: Optional[str],
    powiat: Optional[str],
    exclude_id: Optional[str] = None,
) -> Tuple[List[SimilarReportGroup], int]:
    """
    Podobne zgłoszenia z regionu: wcześniejsze anonimowe zapytania Matchmakingu i wpisy Rejestru Wyzwań
    o tych samych potrzebach, zagregowane per powiat (bez treści zapytań mieszkańców i bez danych osobowych).
    """
    q = select(ProblemReport).order_by(ProblemReport.created_at.desc()).limit(SIMILAR_SCAN_LIMIT)
    reports = (await db.execute(q)).scalars().all()
    needed = min(2, len(query_concepts))
    wanted = set(query_concepts)

    groups: Dict[Optional[str], Dict[str, Any]] = {}
    total = 0
    for r in reports:
        if r.id == exclude_id:
            continue
        if wanted:
            text = f"{r.title or ''}. {r.clean_text or ''}"
            if len(wanted & set(detect_concepts(text))) < needed:
                continue
        elif not category or r.category != category:
            continue
        total += 1
        g = groups.setdefault(r.powiat, {"count": 0, "registry": 0, "last": None, "titles": []})
        g["count"] += 1
        if r.created_at and (g["last"] is None or r.created_at > g["last"]):
            g["last"] = r.created_at
        # Tytuły pokazujemy tylko dla wpisów Rejestru Wyzwań (redagowane przez urzędników, zanonimizowane);
        # treści zapytań mieszkańców z Matchmakingu nie są ujawniane.
        if r.status != "matched":
            g["registry"] += 1
            if r.title and len(g["titles"]) < 2:
                g["titles"].append(anonymize_text(r.title)[:120])

    ordered = sorted(groups.items(), key=lambda kv: (kv[0] != powiat or powiat is None, -kv[1]["count"]))
    result = [
        SimilarReportGroup(
            powiat=p,
            powiat_label=powiat_label(p),
            count=g["count"],
            registry_count=g["registry"],
            last_reported_at=g["last"],
            example_titles=g["titles"],
            is_user_powiat=bool(powiat and p == powiat),
        )
        for p, g in ordered[:SIMILAR_GROUPS_LIMIT]
    ]
    return result, total


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

    # 3a. Które słowa opisu zdecydowały o dopasowaniu (do podświetlenia i „Dopasowano, bo: …”)
    evidence = detect_concepts_with_evidence(clean_text)
    lexical_by_span: Dict[Span, str] = {}
    for r in ranked:
        r_spans: List[Span] = [sp for k in r["shared_concepts"] for sp in evidence.get(k, [])]
        lex = lexical_spans(clean_text, _distinctive_terms(r["shared_terms"]))
        for sp in lex:
            lexical_by_span.setdefault(sp, r["meta"]["title"])
        r["keywords"] = _span_text(clean_text, r_spans + lex)[:8]
    highlights = build_highlights(clean_text, evidence, lexical_by_span)

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
            matched_keywords=r["keywords"],
            etr_summary=r["meta"].get("etr_summary"),
            video_url=r["meta"].get("video_url"),
            handbook_url=r["meta"].get("handbook_url"),
        )
        for r in ranked
    ]

    # 5. Zapis zgłoszenia (tylko tekst zanonimizowany) do analityki trendów
    report_id = f"prob-{uuid.uuid4().hex[:8]}"
    db.add(ProblemReport(
        id=report_id,
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
    similar_reports, similar_total = await find_similar_reports(
        db, query_concepts, report_category, req.powiat, exclude_id=report_id
    )

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
        highlights=highlights,
        similar_reports=similar_reports,
        similar_reports_total=similar_total,
        ceneo_intro=synthesis["ceneo_intro"],
        ceneo_bundle_rationale=synthesis["ceneo_bundle_rationale"],
        action_steps=synthesis["action_steps"],
        ai_generated=bool(llm_why),
    )
