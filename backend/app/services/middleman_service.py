from datetime import datetime
from app.schemas.middleman_schema import AdaptationRequest, AdaptationResponse, ServiceBlueprint, RiskItem

INNOVATION_PROFILES = {
    "rops-inn-001": {
        "title": "Mobilny Doradca Seniora",
        "base_budget": 45000,
        "service_name": "Gminna Usługa Mobilnego Wsparcia Seniora",
        "staff": "1 koordynator ds. senioralnych (0.5 etatu) + współpraca z kierowcą OSP lub GOPS"
    },
    "rops-inn-002": {
        "title": "Modularna Łazienka Wytchnieniowa",
        "base_budget": 32000,
        "service_name": "Program Wypożyczalni Modułów Sanitarnych dla Niesamodzielnych",
        "staff": "Koordynator sprzętu w CUS/OPS + umowa serwisowa z lokalną firmą hydrauliczną"
    },
    "rops-inn-003": {
        "title": "koMIX Życiowy – Komiksy Terapeutyczne",
        "base_budget": 12000,
        "service_name": "Szkolny Program Profilaktyki Zdrowia Psychicznego 'koMIX'",
        "staff": "Psycholodzy szkolni w gminnych zespołach szkół"
    },
    "rops-inn-004": {
        "title": "Terapeuta Przestrzeni",
        "base_budget": 18000,
        "service_name": "Gminny Program Bezpieczny Dom Seniora",
        "staff": "Fizjoterapeuta środowiskowy (umowa zlecenie) + monter komunalny"
    }
}

def adapt_innovation_for_municipality(req: AdaptationRequest) -> AdaptationResponse:
    profile = INNOVATION_PROFILES.get(req.innovation_id, {
        "title": "Innowacja Społeczna ROPS",
        "base_budget": 30000,
        "service_name": "Lokalny Program Usług Społecznych",
        "staff": "Koordynator w Ośrodku Pomocy Społecznej (0.5 etatu)"
    })

    # Skalowanie budżetu w zależności od populacji i odsetka seniorów
    scale_factor = max(0.8, min(2.5, (req.population / 5000.0) * (req.senior_percentage / 20.0)))
    setup_cost = int(profile["base_budget"] * scale_factor)
    monthly_cost = int(setup_cost * 0.12)

    org_unit = "Centrum Usług Społecznych" if req.has_cus else "Gminny Ośrodek Pomocy Społecznej (GOPS)"

    operational_steps = [
        f"Krok 1: Uchwała intencyjna Rady Gminy {req.municipality_name} oraz porozumienie z ROPS Kraków o transferze innowacji '{profile['title']}'.",
        f"Krok 2: Włączenie usługi do Programu Usług Społecznych realizowanego przez {org_unit}.",
        f"Krok 3: Rekrutacja i szkolenie kadry: {profile['staff']}.",
        f"Krok 4: Kampania informacyjna w sołectwach, kościołach i u sołtysów.",
        f"Krok 5: Uruchomienie świadczenia usługi dla minimum {int(req.population * 0.02)} bezpośrednich beneficjentów w pierwszym półroczu.",
        f"Krok 6: Półroczna ewaluacja satysfakcji mieszkańców według standardu ROPS Kraków."
    ]

    resolution_draft = f"""PROJEKT UCHWAŁY NR .../2026
RADY GMINY {req.municipality_name.upper()}
z dnia ... 2026 r.

w sprawie przyjęcia Programu Wdrażania Innowacji Społecznej '{profile['service_name']}' na terenie Gminy {req.municipality_name}

Na podstawie art. 18 ust. 2 pkt 15 ustawy z dnia 8 marca 1990 r. o samorządzie gminnym (Dz. U. z 2024 r. poz. 609) oraz art. 17 ust. 2 pkt 4 ustawy z dnia 12 marca 2004 r. o pomocy społecznej, Rada Gminy uchwala, co następuje:

§ 1. Przyjmuje się do realizacji Program '{profile['service_name']}', oparty na sprawdzonej innowacji społecznej Regionalnego Ośrodka Polityki Społecznej w Krakowie.
§ 2. Celem programu jest bezpośrednia poprawa jakości życia, bezpieczeństwa i integracji mieszkańców, ze szczególnym uwzględnieniem seniorów ({req.senior_percentage}% populacji gminy) oraz osób z niepełnosprawnościami.
§ 3. Koordynację realizacji programu powierza się Kierownikowi {org_unit} w {req.municipality_name}.
§ 4. Źródłem finansowania programu będą środki własne gminy w kwocie {setup_cost} zł z możliwością ubiegania się o refundację w ramach programu Fundusze Europejskie dla Małopolski 2021-2027.
§ 5. Uchwała wchodzi w życie z dniem podjęcia."""

    blueprint = ServiceBlueprint(
        title=f"Pakiet Wdrożeniowy Usługi: {profile['service_name']} dla {req.municipality_name}",
        summary=f"Kompleksowy plan operacyjny adaptacji innowacji '{profile['title']}' ROPS Kraków do specyfiki gminy {req.municipality_name} (powiat {req.powiat}, populacja: {req.population:,} mieszkańców, odsetek seniorów: {req.senior_percentage}%).",
        operational_steps=operational_steps,
        estimated_budget={
            "koszt_uruchomienia_pln": setup_cost,
            "miesieczny_koszt_utrzymania_pln": monthly_cost,
            "rekomendowane_zrodlo": "Program Fundusze Europejskie dla Małopolski 2021-2027 (EFS+) oraz wkład własny gminy",
            "wskaznik_efektywnosci_kosztowej": "Bardzo wysoki (wykorzystanie gotowej metodyki i procedur ROPS bez kosztów badań wstępnych)"
        },
        staffing_requirements=profile["staff"],
        resolution_draft=resolution_draft,
        risk_mitigation=[
            RiskItem(
                risk="Niska świadomość mieszkańców o nowej usłudze w odległych sołectwach",
                action="Wykorzystanie sieci sołtysów, kół gospodyń wiejskich oraz parafii do bezpośredniego informowania seniorów."
            ),
            RiskItem(
                risk="Przejściowe braki kadrowe w opiece środowiskowej",
                action="Porozumienie z sąsiednią gminą lub zlecenie części zadań lokalnemu podmiotowi ekonomii społecznej (PES/CIS/ZAZ)."
            )
        ]
    )

    return AdaptationResponse(
        blueprint=blueprint,
        generated_at=datetime.utcnow().isoformat()
    )
