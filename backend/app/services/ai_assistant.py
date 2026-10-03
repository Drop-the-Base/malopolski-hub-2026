import uuid
from typing import Dict, Any, List
from app.schemas.idea_schema import CanvasSubmission, CanvasAuditResponse, GrantApplicationRequest, GrantApplicationResponse

def evaluate_canvas(canvas: CanvasSubmission) -> CanvasAuditResponse:
    """
    Audytuje 9 bloków Canwy Innowacji Społecznej ROPS Kraków.
    Analizuje spójność, wykrywa luki logiczne i generuje prompt do wizualizatora prototypu.
    """
    strengths: List[str] = []
    logic_gaps: List[str] = []
    tips: List[str] = []
    score = 70

    # 1. Analiza problemu i grupy docelowej
    if len(canvas.problem) > 25 and len(canvas.target_group) > 10:
        strengths.append("Jasno zdefiniowana grupa docelowa w powiązaniu z konkretnym problemem.")
        score += 8
    else:
        logic_gaps.append("Opis problemu lub grupy docelowej jest zbyt ogólny. Doprecyzuj wiek i specyfikę beneficjentów.")
        score -= 5

    # 2. Wartość innowacji
    if len(canvas.value_proposition) > 20:
        strengths.append("Przekonująca propozycja wartości odpowiadająca na zdiagnozowane wyzwanie.")
        score += 8
    else:
        logic_gaps.append("Wartość innowacji wymaga wyostrzenia – co dokładnie zyska beneficjent, czego nie dają istniejące usługi OPS?")
        score -= 5

    # 3. Wskaźniki sukcesu
    metrics_lower = canvas.metrics.lower()
    if any(k in metrics_lower for k in ["liczba", "ilość", "%", "wzrost", "spadek", "skala", "ankieta"]):
        strengths.append("Wskaźniki sukcesu zawierają mierzalne parametry ilościowe lub jakościowe.")
        score += 8
    else:
        logic_gaps.append("Wskaźniki sukcesu są niemierzalne. Dodaj konkretne wielkości (np. 'liczba 30 seniorów objętych opieką', 'wzrost poczucia bezpieczeństwa o 25%').")
        score -= 10

    # 4. Partnerzy i zasoby
    if len(canvas.partners) > 10 and len(canvas.resources) > 10:
        strengths.append("Uwzględniono współpracę międzysektorową i wykorzystanie lokalnych zasobów.")
        score += 6
    else:
        tips.append("Zalecamy włączenie lokalnego CUS, Koła Gospodyń Wiejskich lub OSP jako partnera wspierającego.")

    score = min(98, max(50, score))

    # Generowanie promptu wizualizacji koncepcyjnej przedmiotu / usługi
    visual_concept_prompt = (
        f"Koncepcja wizualna innowacji społecznej: {canvas.value_proposition}. "
        f"Przedstawienie przyjaznego, dostępnego dla osób starszych i młodzieży prototypu w otoczeniu małopolskiej społeczności lokalnej. "
        f"Styl: ciepły, ergonomiczny, włączający, z wyraźnym oznaczeniem dostępności bez barier."
    )

    return CanvasAuditResponse(
        overall_score=score,
        strengths=strengths,
        logic_gaps=logic_gaps,
        coaching_tips=tips if tips else ["Pamiętaj o przetestowaniu prototypu z minimum 5 użytkownikami przed wdrożeniem."],
        visual_concept_prompt=visual_concept_prompt
    )

from datetime import datetime

def generate_grant_application(req: GrantApplicationRequest) -> GrantApplicationResponse:
    """Generuje profesjonalny wniosek grantowy na nabór ROPS Kraków."""
    app_id = f"ROPS-IS-2026/{uuid.uuid4().hex[:6].upper()}"
    budget_total = req.requested_budget_pln

    # Podział budżetu wg standardów grantów na innowacje ROPS
    b_staff = int(budget_total * 0.40)
    b_prototyping = int(budget_total * 0.35)
    b_testing = int(budget_total * 0.15)
    b_admin = int(budget_total * 0.10)

    canvas = req.canvas_data or {}
    prob_diag = canvas.get("problem") or req.summary
    value_prop = canvas.get("value_proposition") or "Oddolne, elastyczne wsparcie środowiskowe"
    test_plan = canvas.get("testing_plan") or "Realizacja w 3 etapach: dopracowanie prototypu, testy w społeczności lokalnej, ewaluacja SUS"
    barrier = canvas.get("barriers") or "Trudności rekrutacyjne i bariery komunikacyjne"

    diagnosis_text = (
        f"Zdiagnozowana potrzeba: {prob_diag}. "
        f"Projekt odpowiada na brak dostępnych alternatyw publicznych w powiecie {req.powiat or 'małopolskim'}. "
        f"Wartość dodana innowacji: {value_prop}."
    )

    methodology_text = (
        f"Metodyka wdrażania i prototypowania: {test_plan}. "
        f"Współpraca lokalna oparta na zasobach: {canvas.get('resources', 'infrastruktura sołecka i kadry CUS/OPS')}. "
        f"Partnerzy wdrożeniowi: {canvas.get('partners', 'OPS, Koło Gospodyń Wiejskich, OSP')}."
    )

    indicators = [
        f"Opracowanie i przetestowanie 1 gotowego prototypu innowacji społecznej: '{req.idea_title}'",
        f"Objęcie bezpośrednimi testami minimum 25 przedstawicieli grupy docelowej ({req.target_group})",
        f"Uzyskanie satysfakcji użytkowników w skali SUS powyżej 80 punktów (standard ROPS Kraków)",
        f"Przygotowanie podręcznika skalowania dla innych gmin powiatu {req.powiat or 'małopolskiego'}"
    ]

    risks = [
        {"risk": f"Bariery wdrożeniowe: {barrier[:80]}", "action": "Bezpośrednia współpraca z sołtysem, parafią i lokalnym CUS"},
        {"risk": "Ryzyko rotacji testerów lub brak zaufania seniorów", "action": "Wdrożenie asystentów sąsiedzkich oraz uproszczonych materiałów ETR"},
        {"risk": "Ryzyko przekroczenia harmonogramu prototypowania", "action": "Bieżący monitoring postępów przez opiekuna merytorycznego z ramienia ROPS"}
    ]

    declarations = [
        "Oświadczam, że zapoznałem/-am się z Regulaminem Naboru Innowacji Społecznych ROPS Kraków 2026.",
        "Potwierdzam, że wnioskowane wsparcie nie stanowi podwójnego finansowania tych samych wydatków.",
        "Zobowiązuję się do udostępnienia wypracowanych materiałów i podręcznika innowacji na licencji otwartej (Creative Commons).",
        "Wszystkie podane we wniosku informacje są zgodne ze stanem faktycznym i prawnym."
    ]

    return GrantApplicationResponse(
        application_id=app_id,
        call_title=req.call_title,
        submission_date=datetime.utcnow().strftime("%d.%m.%Y"),
        applicant_name=req.author_name or "Obywatel / Lider Społeczny Małopolski",
        powiat=req.powiat or "Kraków",
        gmina=req.gmina or "Gmina zgłaszająca",
        target_group=req.target_group,
        idea_title=req.idea_title,
        executive_summary=f"Projekt '{req.idea_title}' stanowi oddolną odpowiedź na potrzeby: {req.target_group}. Celem jest opracowanie, 3-miesięczny pilotaż i ewaluacja innowacji społecznej o wysokim potencjale replikacji.",
        problem_diagnosis=diagnosis_text,
        detailed_methodology=methodology_text,
        budget_breakdown={
            "Wynagrodzenia zespołu innowatorów i animatorów (40%)": b_staff,
            "Materiały, wyposażenie prototypu i adaptacja (35%)": b_prototyping,
            "Organizacja testów z użytkownikami i warsztaty (15%)": b_testing,
            "Obsługa administracyjna, ewaluacja i promocja (10%)": b_admin
        },
        total_budget_pln=budget_total,
        monitoring_indicators=indicators,
        risk_assessment=risks,
        declarations=declarations
    )
