import re
from datetime import datetime
from app.core.constants import format_pl_number, powiat_locative
from app.models.innovation import Innovation
from app.schemas.middleman_schema import AdaptationRequest, AdaptationResponse, ServiceBlueprint, RiskItem

INNOVATION_PROFILES = {
    "rops-inn-001": {
        "base_budget": 45000,
        "service_name": "Gminna Usługa Mobilnego Wsparcia Seniora",
        "staff": "1 koordynator ds. senioralnych (0,5 etatu) + współpraca z kierowcą OSP lub OPS/CUS",
        "beneficiary_share": 0.02,
    },
    "rops-inn-002": {
        "base_budget": 32000,
        "service_name": "Program Wypożyczalni Modułów Sanitarnych dla Osób Niesamodzielnych",
        "staff": "Koordynator sprzętu w OPS/CUS + umowa serwisowa z lokalną firmą instalacyjną",
        "beneficiary_share": 0.003,
    },
    "rops-inn-003": {
        "base_budget": 12000,
        "service_name": "Szkolny Program Profilaktyki Zdrowia Psychicznego „koMIX”",
        "staff": "Psycholodzy i pedagodzy szkolni w gminnych szkołach (szkolenie 16 h)",
        "beneficiary_share": 0.03,
    },
    "rops-inn-004": {
        "base_budget": 18000,
        "service_name": "Gminny Program „Bezpieczny Dom Seniora”",
        "staff": "Fizjoterapeuta środowiskowy (umowa zlecenie) + monter komunalny",
        "beneficiary_share": 0.01,
    },
    "rops-inn-005": {
        "base_budget": 38000,
        "service_name": "Mobilna Pracownia Integracji Sensorycznej dla Szkół i Przedszkoli",
        "staff": "Terapeuta SI (umowa zlecenie) + koordynator w gminnym zespole oświaty",
        "beneficiary_share": 0.01,
    },
    "rops-inn-006": {
        "base_budget": 15000,
        "service_name": "Gminny Klub Cyfrowy Senior+",
        "staff": "Animator cyfrowy (0,25 etatu) + wolontariusze 60+ i młodzież",
        "beneficiary_share": 0.015,
    },
    "rops-inn-007": {
        "base_budget": 70000,
        "service_name": "Gminny Program Bonów Opieki Wytchnieniowej",
        "staff": "Koordynator bonów w OPS/CUS + opiekunowie medyczni (umowa z podmiotem zewnętrznym)",
        "beneficiary_share": 0.004,
    },
    "rops-inn-008": {
        "base_budget": 9000,
        "service_name": "Sąsiedzki Punkt Wymiany Żywności i Sadzonek",
        "staff": "Animator społeczny (wolontariat lub 0,25 etatu) + Koło Gospodyń Wiejskich",
        "beneficiary_share": 0.02,
    },
    "rops-inn-009": {
        "base_budget": 30000,
        "service_name": "Program Mentoringu Usamodzielnienia Wychowanków Pieczy Zastępczej",
        "staff": "Koordynator mentoringu w PCPR/OPS + mentorzy-wolontariusze",
        "beneficiary_share": 0.001,
    },
    "rops-inn-010": {
        "base_budget": 14000,
        "service_name": "Strefa Komunikacji Alternatywnej (AAC) w Urzędzie Gminy",
        "staff": "2 przeszkolonych pracowników obsługi klienta urzędu (szkolenie AAC 8 h)",
        "beneficiary_share": 0.005,
    },
}

DEFAULT_PROFILE = {
    "base_budget": 30000,
    "staff": "Koordynator w ośrodku pomocy społecznej (0,5 etatu)",
    "beneficiary_share": 0.01,
}

_PREFIXES = re.compile(r"^(?:urząd\s+)?(?:miasto\s+i\s+gmina|gmina\s+miejsko-wiejska|gmina\s+wiejska|gmina\s+miejska|gmina|gm\.)\s+", re.IGNORECASE)


def clean_municipality_name(name: str) -> str:
    """'Gmina Słaboszów' -> 'Słaboszów' (nazwa gminy w dokumentach występuje po słowie 'Gminy')."""
    return _PREFIXES.sub("", name.strip()).strip() or name.strip()


def adapt_innovation_for_municipality(req: AdaptationRequest, innovation: Innovation) -> AdaptationResponse:
    profile = {**DEFAULT_PROFILE, "service_name": f"Program „{innovation.title}”", **INNOVATION_PROFILES.get(innovation.id, {})}
    gmina = clean_municipality_name(req.municipality_name)

    # Skalowanie budżetu w zależności od liczby mieszkańców i odsetka seniorów
    scale_factor = max(0.8, min(2.5, (req.population / 5000.0) * (max(req.senior_percentage, 5.0) / 20.0)))
    setup_cost = int(round(profile["base_budget"] * scale_factor, -2))
    monthly_cost = int(round(setup_cost * 0.12, -1))
    annual_running = monthly_cost * 12
    beneficiaries = max(5, int(req.population * profile["beneficiary_share"]))

    if req.has_cus:
        unit_genitive = "Centrum Usług Społecznych"
        unit_head_dative = "Dyrektorowi Centrum Usług Społecznych"
    else:
        unit_genitive = "Gminnego Ośrodka Pomocy Społecznej"
        unit_head_dative = "Kierownikowi Gminnego Ośrodka Pomocy Społecznej"

    operational_steps = [
        f"Krok 1: Decyzja wójta/burmistrza i porozumienie z ROPS Kraków o transferze innowacji „{innovation.title}”.",
        f"Krok 2: Włączenie usługi do gminnego programu usług społecznych realizowanego przez {unit_genitive.replace('Gminnego Ośrodka', 'Gminny Ośrodek')}.",
        f"Krok 3: Rekrutacja i szkolenie kadry: {profile['staff']}.",
        "Krok 4: Kampania informacyjna przez sołtysów, parafie, Koła Gospodyń Wiejskich i tablice ogłoszeń (wersja ETR).",
        f"Krok 5: Uruchomienie usługi dla ok. {format_pl_number(beneficiaries)} odbiorców w pierwszym półroczu.",
        "Krok 6: Ewaluacja po 6 miesiącach (ankieta satysfakcji, liczba odbiorców, koszt na odbiorcę) i decyzja o kontynuacji.",
    ]

    resolution_draft = f"""PROJEKT UCHWAŁY NR .../.../2026
RADY GMINY {gmina.upper()}
z dnia ... 2026 r.

w sprawie przyjęcia programu „{profile['service_name']}” na terenie Gminy {gmina}

Na podstawie art. 18 ust. 2 pkt 15 ustawy z dnia 8 marca 1990 r. o samorządzie gminnym (t.j. Dz. U. z … r. poz. … ze zm.) oraz art. 17 ustawy z dnia 12 marca 2004 r. o pomocy społecznej (t.j. Dz. U. z … r. poz. … ze zm.) Rada Gminy {gmina} uchwala, co następuje:

§ 1. Przyjmuje się do realizacji program „{profile['service_name']}”, oparty na innowacji społecznej „{innovation.title}” opracowanej we współpracy z Regionalnym Ośrodkiem Polityki Społecznej w Krakowie, stanowiący załącznik do uchwały.
§ 2. Celem programu jest poprawa jakości życia, bezpieczeństwa i integracji mieszkańców Gminy {gmina}, w szczególności osób starszych (ok. {req.senior_percentage:g}% mieszkańców) oraz osób z niepełnosprawnościami.
§ 3. Realizację programu powierza się {unit_head_dative}.
§ 4. Program finansowany jest ze środków własnych Gminy {gmina}: koszt uruchomienia ok. {format_pl_number(setup_cost)} zł oraz koszt utrzymania ok. {format_pl_number(monthly_cost)} zł miesięcznie (ok. {format_pl_number(annual_running)} zł rocznie), z możliwością pozyskania dofinansowania zewnętrznego, w tym z programu Fundusze Europejskie dla Małopolski 2021–2027.
§ 5. Wykonanie uchwały powierza się Wójtowi Gminy {gmina}.
§ 6. Uchwała wchodzi w życie z dniem podjęcia."""

    risks = [
        RiskItem(
            risk="Niska świadomość mieszkańców o nowej usłudze w odległych sołectwach",
            action="Informowanie przez sołtysów, Koła Gospodyń Wiejskich i parafie; ulotki w tekście łatwym do czytania (ETR)."
        ),
        RiskItem(
            risk="Przejściowe braki kadrowe",
            action="Porozumienie z sąsiednią gminą lub zlecenie części zadań podmiotowi ekonomii społecznej (PES/CIS/ZAZ)."
        ),
    ]
    if req.annual_budget_pln and setup_cost + annual_running > req.annual_budget_pln:
        risks.insert(0, RiskItem(
            risk=(f"Koszt pierwszego roku (ok. {format_pl_number(setup_cost + annual_running)} zł) przekracza wskazany "
                  f"budżet roczny ({format_pl_number(req.annual_budget_pln)} zł)"),
            action="Etapowanie wdrożenia (pilotaż w 1–2 sołectwach) lub wniosek o dofinansowanie zewnętrzne przed startem."
        ))

    blueprint = ServiceBlueprint(
        title=f"Projekt pakietu wdrożeniowego: {profile['service_name']} – Gmina {gmina}",
        summary=(
            f"Plan adaptacji innowacji „{innovation.title}” do warunków Gminy {gmina} ({powiat_locative(req.powiat)}; "
            f"liczba mieszkańców: {format_pl_number(req.population)}; odsetek seniorów: {req.senior_percentage:g}%)."
        ),
        operational_steps=operational_steps,
        estimated_budget={
            "koszt_uruchomienia_pln": setup_cost,
            "miesieczny_koszt_utrzymania_pln": monthly_cost,
            "roczny_koszt_utrzymania_pln": annual_running,
            "rekomendowane_zrodlo": "Środki własne gminy; możliwe dofinansowanie z programu Fundusze Europejskie dla Małopolski 2021–2027 (EFS+)",
            "wskaznik_efektywnosci_kosztowej": f"ok. {format_pl_number((setup_cost + annual_running) / beneficiaries)} zł na odbiorcę w pierwszym roku",
        },
        staffing_requirements=profile["staff"],
        resolution_draft=resolution_draft,
        risk_mitigation=risks,
        disclaimer=(
            "Dokument roboczy wygenerowany automatycznie na podstawie szablonu. Kwoty są szacunkowe. "
            "Podstawy prawne i publikatory (Dz. U.) należy uzupełnić aktualnymi tekstami jednolitymi, "
            "a projekt uchwały skonsultować z radcą prawnym gminy."
        ),
    )

    return AdaptationResponse(blueprint=blueprint, generated_at=datetime.utcnow().isoformat())
