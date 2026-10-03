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

def generate_grant_application(req: GrantApplicationRequest) -> GrantApplicationResponse:
    """Generuje profesjonalny wniosek grantowy na nabór ROPS Kraków."""
    app_id = f"grant-{uuid.uuid4().hex[:8]}"
    budget_total = req.requested_budget_pln

    # Podział budżetu wg standardów grantów na innowacje ROPS
    b_staff = int(budget_total * 0.40)
    b_prototyping = int(budget_total * 0.35)
    b_testing = int(budget_total * 0.15)
    b_admin = int(budget_total * 0.10)

    return GrantApplicationResponse(
        application_id=app_id,
        call_title=req.call_title,
        executive_summary=f"Projekt '{req.idea_title}' stanowi odpowiedź na zidentyfikowane potrzeby grupy: {req.target_group}. Celem jest opracowanie, pilotaż i ewaluacja innowacyjnego mikrorozwiązania społecznego.",
        problem_diagnosis=f"Wnioskowana innowacja adresuje barierę: {req.summary}. Badania i dane ROPS Kraków potwierdzają wysokie zapotrzebowanie na oddolne formy wsparcia w tym obszarze.",
        detailed_methodology="Realizacja w 3 etapach: 1. Dopracowanie Canwy Innowacji (miesiące 1-2), 2. Budowa i warsztaty prototypu (miesiące 3-5), 3. Testy w środowisku rzeczywistym z ankietami SUS i ewaluacją (miesiące 6-8).",
        budget_breakdown={
            "Wynagrodzenia zespołu innowacyjnego i ekspertów (40%)": b_staff,
            "Materiały, prototypowanie i adaptacja narzędzi (35%)": b_prototyping,
            "Koszty testowania z użytkownikami końcowymi (15%)": b_testing,
            "Koordynacja, promocja i zarządzanie projektem (10%)": b_admin
        },
        monitoring_indicators=[
            f"Opracowanie 1 kompletnego modelu innowacji społecznej",
            f"Objęcie testami minimum 20 przedstawicieli grupy docelowej ({req.target_group})",
            f"Osiągnięcie wskaźnika użyteczności SUS > 75 punktów w ewaluacji końcowej"
        ],
        risk_assessment=[
            {"risk": "Trudności z rekrutacją grupy do testów", "action": "Współpraca z lokalnym OPS/CUS i liderami sołeckimi"},
            {"risk": "Bariery cyfrowe beneficjentów", "action": "Zastosowanie piktogramów oraz wsparcie asystenta wolontariusza"}
        ]
    )
