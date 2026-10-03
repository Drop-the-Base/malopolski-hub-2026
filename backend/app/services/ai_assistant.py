import re
import uuid
from datetime import date, datetime
from typing import Dict, List, Optional
from app.core.constants import powiat_locative, format_pl_number
from app.schemas.idea_schema import (
    CanvasSubmission, CanvasAuditResponse, GrantApplicationRequest, GrantApplicationResponse, GrantCall
)

CANVAS_FIELDS = {
    "problem": "Problem",
    "target_group": "Grupa docelowa",
    "value_proposition": "Propozycja wartości",
    "barriers": "Bariery",
    "resources": "Zasoby",
    "partners": "Partnerzy",
    "testing_plan": "Plan testów",
    "metrics": "Wskaźniki sukcesu",
    "scalability": "Skalowanie",
}

# Typy instytucji, które realnie działają w małopolskich gminach – pozwalają wychwycić wymyślone nazwy partnerów
KNOWN_PARTNER_TYPES = [
    "gops", "mops", "ops", "cus", "centrum usług społecznych", "ośrodek pomocy", "pcpr", "koło gospodyń", "kgw",
    "osp", "straż pożarna", "szkoł", "przedszkol", "parafi", "bibliotek", "dom kultury", "gok", "fundacj",
    "stowarzyszeni", "ngo", "organizacj", "uczelni", "uniwersytet", "rops", "urząd pracy", "pup", "sołt",
    "rada sołecka", "spółdzielni", "cis", "zaz", "wtz", "poradni", "gmina", "urząd gminy", "powiat", "przychodni",
]
MEASURABLE_HINTS = re.compile(r"\d|%|liczba|odsetek|wzrost|spadek|ankiet|skal[ai]|minimum|co najmniej")


def evaluate_canvas(canvas: CanvasSubmission) -> CanvasAuditResponse:
    """
    Automatyczna checklista Canwy (reguły, nie model językowy): kompletność pól, mierzalność,
    rozpoznawalność partnerów i spójność grupy docelowej z problemem. Wynik 0–100.
    """
    strengths: List[str] = []
    gaps: List[str] = []
    tips: List[str] = []
    score = 0

    # 1. Kompletność – każde pole do 6 pkt (54 pkt)
    filled = 0
    for key, label in CANVAS_FIELDS.items():
        text = (getattr(canvas, key) or "").strip()
        words = len(text.split())
        if words >= 6:
            score += 6
            filled += 1
        elif words >= 3:
            score += 3
            gaps.append(f"Pole „{label}” jest bardzo krótkie – rozwiń je do 1–2 konkretnych zdań.")
        else:
            gaps.append(f"Pole „{label}” jest puste lub niewypełnione merytorycznie.")
    if filled == len(CANVAS_FIELDS):
        strengths.append("Wszystkie 9 pól Canwy zostało wypełnionych treścią.")

    # 2. Mierzalne wskaźniki (14 pkt)
    if MEASURABLE_HINTS.search(canvas.metrics.lower()) and len(canvas.metrics.split()) >= 4:
        score += 14
        strengths.append("Wskaźniki sukcesu zawierają mierzalne wartości.")
    else:
        gaps.append("Wskaźniki sukcesu są niemierzalne – podaj liczby (np. „30 seniorów”, „80% zadowolonych w ankiecie”).")
    if "sus" in canvas.metrics.lower() and not any(k in (canvas.value_proposition + canvas.resources).lower()
                                                     for k in ["aplikac", "stron", "cyfrow", "platform", "system"]):
        tips.append("Skala SUS mierzy użyteczność systemów cyfrowych – dla usługi lepsza będzie ankieta satysfakcji lub pomiar przed/po.")

    # 3. Partnerzy rozpoznawalni (12 pkt)
    partners_lower = canvas.partners.lower()
    known = [p for p in KNOWN_PARTNER_TYPES if p in partners_lower]
    if known:
        score += 12
        strengths.append("Partnerzy to rozpoznawalne typy lokalnych instytucji.")
    elif canvas.partners.strip():
        gaps.append("Nie rozpoznano typowych instytucji wśród partnerów – sprawdź, czy wskazane podmioty istnieją w Twojej gminie (np. GOPS/CUS, KGW, OSP, szkoła, NGO).")
    else:
        tips.append("Wskaż co najmniej jednego lokalnego partnera (GOPS/CUS, KGW, OSP, szkoła, parafia, NGO).")

    # 4. Plan testów z czasem/skalą (10 pkt)
    if re.search(r"\d", canvas.testing_plan) and len(canvas.testing_plan.split()) >= 6:
        score += 10
        strengths.append("Plan testów określa skalę lub czas pilotażu.")
    else:
        tips.append("Dopisz w planie testów, ile osób i jak długo będzie testować prototyp (np. „15 osób przez 3 miesiące”).")

    # 5. Spójność grupy docelowej z problemem (10 pkt)
    tg_words = {w for w in re.findall(r"[a-ząćęłńóśźż]{5,}", canvas.target_group.lower())}
    problem_words = {w for w in re.findall(r"[a-ząćęłńóśźż]{5,}", (canvas.problem + " " + canvas.value_proposition).lower())}
    if tg_words and any(t[:5] == p[:5] for t in tg_words for p in problem_words):
        score += 10
        strengths.append("Grupa docelowa jest spójna z opisem problemu.")
    else:
        tips.append("Upewnij się, że opis problemu wprost odnosi się do wskazanej grupy docelowej.")

    score = max(0, min(100, score))
    if not tips:
        tips.append("Przetestuj prototyp z co najmniej 5 osobami z grupy docelowej przed złożeniem wniosku.")

    visual_concept_prompt = (
        f"Ilustracja koncepcyjna innowacji społecznej: {canvas.value_proposition.strip() or canvas.problem.strip()}. "
        f"Odbiorcy: {canvas.target_group.strip() or 'mieszkańcy'}. Scena w małopolskiej społeczności lokalnej, "
        f"styl ciepły, realistyczny, dostępny (wysoki kontrast, brak barier architektonicznych), bez tekstu na obrazie."
    )

    return CanvasAuditResponse(
        overall_score=score,
        strengths=strengths,
        logic_gaps=gaps,
        coaching_tips=tips,
        visual_concept_prompt=visual_concept_prompt
    )


# Nabory grantowe – dane demonstracyjne (w produkcji: konfiguracja w panelu ROPS)
_GRANT_CALLS = [
    {
        "id": "nabor-2026-inkubator",
        "title": "Inkubator Innowacji Społecznych – nabór jesienny 2026 (demo)",
        "opens_on": "2026-09-01",
        "closes_on": "2026-11-30",
        "min_budget_pln": 10000,
        "max_budget_pln": 60000,
        "criteria": [
            "Innowacja odpowiada na zdiagnozowaną potrzebę mieszkańców Małopolski",
            "Plan testów z udziałem grupy docelowej",
            "Mierzalne wskaźniki rezultatu",
            "Partnerstwo z co najmniej jedną lokalną instytucją",
        ],
    },
    {
        "id": "nabor-2026-senior",
        "title": "Mikrogranty „Aktywny Senior w Gminie” 2026 (demo)",
        "opens_on": "2026-10-01",
        "closes_on": "2026-10-31",
        "min_budget_pln": 2000,
        "max_budget_pln": 15000,
        "criteria": [
            "Działania skierowane do osób 60+",
            "Realizacja na terenie gminy wiejskiej lub miejsko-wiejskiej",
            "Udział wolontariuszy lub organizacji lokalnych",
        ],
    },
    {
        "id": "nabor-2026-wiosna",
        "title": "Inkubator Innowacji Społecznych – nabór wiosenny 2026 (demo, zamknięty)",
        "opens_on": "2026-03-01",
        "closes_on": "2026-04-30",
        "min_budget_pln": 10000,
        "max_budget_pln": 60000,
        "criteria": ["Nabór zakończony"],
    },
]


def _to_call(raw: dict, today: Optional[date] = None) -> GrantCall:
    today = today or date.today()
    is_open = date.fromisoformat(raw["opens_on"]) <= today <= date.fromisoformat(raw["closes_on"])
    return GrantCall(**raw, is_open=is_open)


def list_grant_calls() -> List[GrantCall]:
    return [_to_call(c) for c in _GRANT_CALLS]


def get_grant_call(call_id: str) -> Optional[GrantCall]:
    raw = next((c for c in _GRANT_CALLS if c["id"] == call_id), None)
    return _to_call(raw) if raw else None


def generate_grant_application(req: GrantApplicationRequest, call: GrantCall) -> GrantApplicationResponse:
    """Szkic wniosku zbudowany z treści Canwy i fiszki; braki są raportowane zamiast zmyślane."""
    app_id = f"SZKIC-{uuid.uuid4().hex[:6].upper()}"
    budget_total = req.requested_budget_pln
    canvas: Dict[str, str] = {k: (v or "").strip() for k, v in (req.canvas_data or {}).items()}
    loc = powiat_locative(req.powiat)

    missing: List[str] = []
    for key, label in CANVAS_FIELDS.items():
        if len(canvas.get(key, "").split()) < 3:
            missing.append(f"Canwa: {label}")
    if not req.powiat:
        missing.append("Lokalizacja (powiat)")
    if not req.gmina:
        missing.append("Gmina realizacji")
    completeness = round(100 * (len(CANVAS_FIELDS) + 2 - len(missing)) / (len(CANVAS_FIELDS) + 2))

    def field(key: str, placeholder: str) -> str:
        return canvas.get(key) or f"[DO UZUPEŁNIENIA: {placeholder}]"

    diagnosis_text = (
        f"Zdiagnozowana potrzeba: {field('problem', req.summary)} "
        f"Grupa docelowa: {canvas.get('target_group') or req.target_group}. "
        f"Obszar realizacji: {req.gmina + ', ' if req.gmina else ''}{loc}. "
        f"Wartość innowacji: {field('value_proposition', 'czym rozwiązanie różni się od istniejących usług')}"
    )
    methodology_text = (
        f"Plan testów: {field('testing_plan', 'ile osób, jak długo, w jaki sposób')} "
        f"Zasoby: {field('resources', 'lokal, sprzęt, kadra')} "
        f"Partnerzy: {field('partners', 'lokalne instytucje i organizacje')} "
        f"Skalowanie: {field('scalability', 'jak inne gminy mogą przejąć rozwiązanie')}"
    )

    b_staff = int(budget_total * 0.40)
    b_prototyping = int(budget_total * 0.35)
    b_testing = int(budget_total * 0.15)
    b_admin = budget_total - b_staff - b_prototyping - b_testing

    indicators = [f"Opracowanie i przetestowanie prototypu „{req.idea_title}”"]
    if canvas.get("metrics"):
        indicators.append(f"Wskaźniki z Canwy: {canvas['metrics']}")
    else:
        indicators.append("[DO UZUPEŁNIENIA: mierzalne wskaźniki rezultatu]")
    indicators.append(f"Podręcznik replikacji dla innych gmin ({loc.removeprefix('w ')})")

    risks = [
        {"risk": f"Bariery wdrożeniowe: {canvas['barriers'][:160]}" if canvas.get("barriers") else "Bariery wdrożeniowe [DO UZUPEŁNIENIA]",
         "action": "Wczesne zaangażowanie sołtysa / rady osiedla i lokalnego OPS/CUS"},
        {"risk": "Rezygnacja uczestników testów", "action": "Rekrutacja z rezerwą 20% i materiały w tekście łatwym do czytania (ETR)"},
        {"risk": "Opóźnienie harmonogramu", "action": "Comiesięczny przegląd postępów z opiekunem merytorycznym ROPS"},
    ]

    declarations = [
        f"Oświadczam, że zapoznałem/-am się z regulaminem naboru „{call.title}”.",
        "Potwierdzam, że wnioskowane wsparcie nie stanowi podwójnego finansowania tych samych wydatków.",
        "Zobowiązuję się do udostępnienia materiałów innowacji na licencji otwartej (Creative Commons).",
        "Wszystkie podane informacje są zgodne ze stanem faktycznym.",
    ]

    return GrantApplicationResponse(
        application_id=app_id,
        call_id=call.id,
        completeness_pct=completeness,
        missing_elements=missing,
        call_title=call.title,
        submission_date=datetime.utcnow().strftime("%d.%m.%Y"),
        applicant_name=req.author_name or "Wnioskodawca",
        powiat=req.powiat or "[DO UZUPEŁNIENIA]",
        gmina=req.gmina,
        target_group=canvas.get("target_group") or req.target_group,
        idea_title=req.idea_title,
        executive_summary=(
            f"Projekt „{req.idea_title}” odpowiada na potrzebę: {req.summary.strip()} "
            f"Wnioskowana kwota: {format_pl_number(budget_total)} zł (limit naboru: "
            f"{format_pl_number(call.min_budget_pln)}–{format_pl_number(call.max_budget_pln)} zł)."
        ),
        problem_diagnosis=diagnosis_text,
        detailed_methodology=methodology_text,
        budget_breakdown={
            "Wynagrodzenia zespołu i animatorów (40%)": b_staff,
            "Materiały i wyposażenie prototypu (35%)": b_prototyping,
            "Testy z użytkownikami i warsztaty (15%)": b_testing,
            "Administracja, ewaluacja i promocja (10%)": b_admin,
        },
        total_budget_pln=budget_total,
        monitoring_indicators=indicators,
        risk_assessment=risks,
        declarations=declarations,
    )
