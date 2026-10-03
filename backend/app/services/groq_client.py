import json
import logging
import re
import time
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def _extract_json_from_text(raw_text: str) -> Optional[Dict[str, Any]]:
    """Wyciąga obiekt JSON z odpowiedzi modelu (znajduje zakres od pierwszego { do ostatniego })."""
    try:
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            candidate = raw_text[start_idx : end_idx + 1]
            try:
                return json.loads(candidate)
            except Exception as ex:
                logger.error(f"Candidate JSON error: {ex}, candidate start: {repr(candidate[:100])}, candidate end: {repr(candidate[-100:])}")
                raise
        return json.loads(raw_text.strip())
    except Exception as e:
        logger.warning(f"Nie udało się sparsować JSON z odpowiedzi Groq: {e}")
        return None

async def groq_chat_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.3,
    max_tokens: int = 1200
) -> Optional[str]:
    """
    Wykonuje asynchroniczne zapytanie do API Groq.
    Zwraca treść odpowiedzi lub None w przypadku braku klucza bądź błędu.
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.warning("GROQ_API_KEY nie jest skonfigurowany. Używanie generatora lokalnego.")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload: Dict[str, Any] = {
        "model": settings.GROQ_MODEL or "openai/gpt-oss-20b",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()
            else:
                logger.error(f"Groq API error {resp.status_code}: {resp.text}")
                return None
    except Exception as e:
        logger.error(f"Wyjątek podczas łączenia z Groq API: {e}")
        return None

async def autofill_social_canvas(prompt: str, powiat: str = "Kraków", target_group: Optional[str] = None) -> Dict[str, Any]:
    """
    Generator 9 bloków Canwy Innowacji Społecznej ROPS Kraków na podstawie 1-zdaniowego pomysłu.
    Odpytuje Groq API z czasem odpowiedzi ~1-2s lub używa szablonu rezerwowego.
    """
    t0 = time.time()
    system_prompt = (
        "Jesteś czołowym ekspertem Regionalnego Ośrodka Polityki Społecznej (ROPS) w Krakowie ds. innowacji społecznych. "
        "Twoim zadaniem jest przekształcić krótki pomysł obywatelski w profesjonalnie uzupełnioną 9-polową Canwę Innowacji Społecznej. "
        "Zwróć odpowiedź WYŁĄCZNIE jako kompletny blok JSON w formacie:\n"
        "```json\n"
        "{\n"
        '  "idea_title": "oficjalny, urzędowy tytuł innowacji",\n'
        '  "problem": "diagnoza problemu (1-2 zwięzłe zdania)",\n'
        '  "target_group": "grupa odbiorców (1 zdanie)",\n'
        '  "value_proposition": "unikalna propozycja wartości innowacji (1-2 zdania)",\n'
        '  "barriers": "bariery społeczne/prawne i sposób ich przezwyciężenia (1 zdanie)",\n'
        '  "resources": "kluczowe zasoby lokalowe, sprzętowe i kadrowe (1 zdanie)",\n'
        '  "partners": "partnerzy lokalni: CUS, GOPS, OSP, Koła Gospodyń, NGO (1 zdanie)",\n'
        '  "testing_plan": "plan 3-miesięcznego prototypowania i testów (1 zdanie)",\n'
        '  "metrics": "mierzalne wskaźniki sukcesu, np. 30 osób, SUS > 80 (1 zdanie)",\n'
        '  "scalability": "ścieżka skalowania na inne gminy Małopolski (1 zdanie)"\n'
        "}\n"
        "```\n"
        "Pisz zwięźle, profesjonalnie, po 1-2 krótkie zdania na pole. Upewnij się, że JSON jest kompletny i domknięty nawiasem }."
    )

    user_prompt = f"Pomysł innowacji: \"{prompt}\". Powiat: {powiat}."
    if target_group:
        user_prompt += f" Sugerowana grupa docelowa: {target_group}."

    raw_response = await groq_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=2200
    )

    t1 = time.time()
    latency_ms = int((t1 - t0) * 1000)

    if raw_response:
        logger.info(f"GROQ RAW RECEIVED ({len(raw_response)} chars): {raw_response[:250]}")
        parsed = _extract_json_from_text(raw_response)
        if parsed and "idea_title" in parsed and "problem" in parsed:
            return {
                "idea_title": parsed.get("idea_title", prompt[:60]),
                "problem": parsed.get("problem", ""),
                "target_group": parsed.get("target_group", target_group or "Mieszkańcy Małopolski"),
                "value_proposition": parsed.get("value_proposition", ""),
                "barriers": parsed.get("barriers", ""),
                "resources": parsed.get("resources", ""),
                "partners": parsed.get("partners", ""),
                "testing_plan": parsed.get("testing_plan", ""),
                "metrics": parsed.get("metrics", ""),
                "scalability": parsed.get("scalability", ""),
                "ai_powered": True,
                "latency_ms": latency_ms
            }

    # Rezerwowy generator lokalny (gwarancja 100% dostępności)
    return _generate_fallback_canvas(prompt, powiat, target_group, latency_ms)

def _generate_fallback_canvas(prompt: str, powiat: str, target_group: Optional[str], latency_ms: int) -> Dict[str, Any]:
    """Lokalny generator wysokiej jakości Canwy (deterministyczny fallback)."""
    p_lower = prompt.lower()
    if "senior" in p_lower or "starsz" in p_lower or "opiek" in p_lower:
        title = f"Mobilna Sieć Wsparcia Senioralnego - {powiat}"
        tg = target_group or "Seniorzy 70+ z ograniczoną sprawnością ruchową oraz ich opiekunowie faktyczni"
        prob = "Izolacja społeczna, utrudniony dostęp do podstawowych usług zdrowotno-pielęgnacyjnych i urzędowych w oddalonych sołectwach powiatu."
        val = "Bezpośrednie dotarcie asystenta do domu seniora wraz z pakietem teleopieki i wsparciem sąsiedzkim."
        bar = "Bariera zaufania osób starszych oraz wykluczenie komunikacyjne; rozwiązanie: współpraca z sołtysami i OSP."
        res = "Samochód służbowy/elektryczny, tablety z uproszczonym interfejsem ETR, zestaw pierwszej pomocy i teleopaska."
        part = "Ośrodek Pomocy Społecznej / CUS, Ochotnicza Straż Pożarna, Koło Gospodyń Wiejskich, ROPS Kraków."
        test = "3-miesięczny pilotaż w 2 sołectwach obejmujący 15 seniorów, cotygodniowe wizyty i ewaluacja samopoczucia."
        met = "Minimum 15 zadowolonych seniorów, 100% zrealizowanych wizyt wsparcia, wskaźnik satysfakcji > 85%."
        scal = "Możliwość transferu do 10 kolejnych gmin wiejskich Małopolski w oparciu o grant z programu FEM 2021-2027."
    elif "młodzie" in p_lower or "psych" in p_lower or "szkoł" in p_lower:
        title = f"Strefa Wytchnienia i Dobrostanu Młodych - {powiat}"
        tg = target_group or "Młodzież w wieku 13-19 lat doświadczająca kryzysów emocjonalnych, rodzice i nauczyciele"
        prob = "Zapaść psychiatrii dziecięcej, wysoki poziom stresu szkolnego, brak bezpiecznej przestrzeni rozmowy bez stygmatyzacji."
        val = "Anonimowa, kawiarniana strefa chilloutu z dostępem do psychologa i rówieśniczego mentoringu poza szkołą."
        bar = "Stygmatyzacja korzystania z pomocy psychologicznej; przełamanie przez luźny format klubowy i komiksy edukacyjne."
        res = "Lokal w centrum gminy/miasta, pufy, gry planszowe, tablet do konsultacji online z terapeutą."
        part = "Poradnia Psychologiczno-Pedagogiczna, Młodzieżowa Rada Gminy, lokalne domy kultury."
        test = "Cykl 12 popołudniowych warsztatów komiksowo-terapeutycznych z grupą 25 nastolatków."
        met = "Objęcie wsparciem 50 nastolatków w kwartale, spadek deklarowanego lęku u 70% uczestników w skali GAD-7."
        scal = "Standaryzacja scenariuszy warsztatów do pobrania przez każdy dom kultury w Małopolsce."
    elif "kawiarenk" in p_lower or "napraw" in p_lower:
        title = f"Międzypokoleniowa Kawiarenka Naprawcza - {powiat}"
        tg = target_group or "Seniorzy-majsterkowicze oraz młodzież ucząca się i pasjonaci DIY"
        prob = "Marnotrawstwo sprawnych urządzeń, osamotnienie seniorów posiadających unikalne umiejętności rzemieślnicze."
        val = "Spotkania w formule kawiarni, gdzie seniorzy uczą młodzież naprawy AGD, rowerów i elektroniki w duchu Zero Waste."
        bar = "Bezpieczeństwo narzędzi i lokal; rozwiązanie: regulamin BHP przygotowany we współpracy z CUS."
        res = "Stół warsztatowy, podstawowe narzędzia elektromechaniczne, ekspres do kawy, salka komunalna."
        part = "Centrum Usług Społecznych, Cech Rzemiosł Różnych, Spółdzielnia Socjalna, ROPS Kraków."
        test = "4 otwarte warsztaty naprawcze w soboty, naprawienie minimum 20 przedmiotów codziennego użytku."
        met = "30 uczestników w różnym wieku, 80% naprawionych sprzętów powracających do obiegu."
        scal = "Gotowy konspekt organizacji Kawiarenki do pobrania dla wszystkich bibliotek i domów kultury w Małopolsce."
    else:
        title = f"Innowacja Społeczna: {prompt[:40]}"
        tg = target_group or "Mieszkańcy gminy zagrożeni wykluczeniem społecznym lub samotnością"
        prob = f"Niezaspokojona potrzeba społeczna w powiecie {powiat}: {prompt}. Brak elastycznych usług publicznych w tym zakresie."
        val = "Nowoczesna, oddolna usługa integrująca społeczność lokalną oparta na modelu wzajemności i zasobach sąsiedzkich."
        bar = "Finansowanie początkowe i formalności samorządowe; rozwiązanie: ścieżka inkubacji ROPS Kraków."
        res = "Świetlica wiejska lub salka osiedlowa, materiały warsztatowe, koordynator wolontariatu (0.5 etatu)."
        part = "Gminny Ośrodek Pomocy Społecznej, Centrum Usług Społecznych, lokalne stowarzyszenia pozarządowe."
        test = "Pilotaż trwający 90 dni, seria 6 spotkań integrujących, zebranie ankiet ewaluacyjnych i feedbacku."
        met = "Zrekrutowanie minimum 20 stałych uczestników, wskaźnik użyteczności SUS > 75 pkt."
        scal = "Zgłoszenie do Bazy Dobrych Praktyk ROPS Kraków i replikacja w subregionach tarnowskim i nowosądeckim."

    return {
        "idea_title": title,
        "problem": prob,
        "target_group": tg,
        "value_proposition": val,
        "barriers": bar,
        "resources": res,
        "partners": part,
        "testing_plan": test,
        "metrics": met,
        "scalability": scal,
        "ai_powered": False,
        "latency_ms": latency_ms
    }

async def generate_groq_match_rationale(problem_text: str, innovation_title: str, category: str) -> Optional[str]:
    """Generuje spersonalizowane 2-zdaniowe uzasadnienie dopasowania innowacji za pomocą Groq."""
    prompt = (
        f"Jesteś doradcą ROPS Kraków. Uzasadnij w maksymalnie 2 zwięzłych zdaniach po polsku, dlaczego innowacja '{innovation_title}' "
        f"(kategoria: {category}) jest właściwą odpowiedzią na potrzebę: '{problem_text}'. "
        f"Nie dodawaj nagłówków ani wstępów, od razu podaj 2 konkretne zdania."
    )
    return await groq_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=150
    )

def _generate_fallback_ceneo_synthesis(
    problem_text: str,
    powiat: Optional[str],
    matched_innovations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Wysokiej jakości deterministyczna synteza dopasowania w stylu Ceneo/Allegro."""
    p_lower = problem_text.lower()
    loc = f"w powiecie {powiat}" if powiat else "w Twojej miejscowości"

    if any(k in p_lower for k in ["senior", "starsz", "wanna", "łazienk", "dziad", "babci", "emeryt", "opiek"]):
        intro = (
            f"Jasne 👵 Zdiagnozowałem sytuację: {loc} mierzysz się z barierami w codziennym funkcjonowaniu osoby starszej, "
            f"trudnościami w higienie lub odcięciem od opieki. Przygotowałem dla Ciebie zgrany zestaw sprawdzonych innowacji ROPS Kraków, "
            f"które kompleksowo zabezpieczają potrzeby seniora i odciążają rodzinę."
        )
        rationale = (
            "Dlaczego ten zestaw tworzy idealny pakiet: Zamiast pojedynczego doraźnego działania łączymy bezpieczną adaptację przestrzeni "
            "(np. Modularna Łazienka / Terapeuta Przestrzeni) z mobilnym wsparciem asystenckim i teleopieką. "
            "Dzięki temu senior zyskuje samodzielność domową, a gmina – gotowy schemat wdrożenia bez budowania drogich ośrodków stacjonarnych."
        )
        steps = [
            "Krok 1: Pobierz bezpłatny podręcznik innowacji i obejrzyj instruktaż wideo w Bazie Wiedzy.",
            "Krok 2: Użyj modułu 'Adaptuj dla Gminy', aby wygenerować kalkulację kosztów i projekt uchwały dla CUS/GOPS.",
            "Krok 3: Zgłoś się do mentora ROPS w zakładce Komunikacja w celu pozyskania grantu do 50 000 zł na pilotaż."
        ]
    elif any(k in p_lower for k in ["psych", "lęk", "depresj", "młodzie", "nastolat", "szkoł", "stres"]):
        intro = (
            f"Jasne 🧠 Rozumiem powagę wyzwania: kryzysy emocjonalne i poczucie osamotnienia młodzieży {loc} "
            f"wymagają szybkiej, środowiskowej interwencji bez stygmatyzacji gabinetowej i wielomiesięcznych kolejek NFZ. "
            f"Skomponowałem dla Ciebie zestaw narzędzi ROPS stworzonych specjalnie do pracy w społeczności lokalnej."
        )
        rationale = (
            "Dlaczego ten zestaw działa komplementarnie: Łączymy narracyjne techniki komiksowo-terapeutyczne (koMIX Życiowy) "
            "z bezpiecznymi strefami wytchnienia oraz tutoringiem rówieśniczym. Młody człowiek nie czuje się etykietowany jako 'chory', "
            "lecz otrzymuje bezpieczne ujście emocji i kontakt z wykwalifikowanym moderatorem."
        )
        steps = [
            "Krok 1: Pobierz pakiety komiksowe i scenariusze zajęć z Bazy Wiedzy ROPS.",
            "Krok 2: Zaangażuj szkołę, bibliotekę lub dom kultury jako partnera lokalnej strefy wsparcia.",
            "Krok 3: Złóż fiszkę w Kreatorze Pomysłów, by otrzymać mikrogrant na pilotażowe warsztaty w Twojej gminie."
        ]
    elif any(k in p_lower for k in ["cyfrow", "komputer", "smartfon", "internet", "bankow"]):
        intro = (
            f"Jasne 💻 Wykryłem barierę cyfrową: {loc} mieszkańcy (zwłaszcza seniorzy) czują się zagubieni "
            f"w obliczu cyfryzacji urzędów, e-recept i bankowości online. Przygotowałem pakiet innowacji ROPS "
            f"przywracających cyfrową samodzielność w przyjaznym tempie."
        )
        rationale = (
            "Dlaczego ten pakiet: Połączyliśmy model międzypokoleniowego mentoringu (młodzież uczy seniorów) "
            "z uproszczonymi instrukcjami w standardzie ETR (Łatwy Tekst do Czytania) oraz mobilnymi punktami wsparcia cyfrowego."
        )
        steps = [
            "Krok 1: Wykorzystaj narzędzie upraszczania tekstów ETR dostępne w menu platformy.",
            "Krok 2: Skontaktuj się z biblioteką publiczną lub CUS w sprawie udostępnienia stanowiska komputerowego.",
            "Krok 3: Zgłoś inicjatywę do inkubatora ROPS – pomożemy przeszkolić wolontariuszy cyfrowych."
        ]
    else:
        intro = (
            f"Jasne 🤝 Zdiagnozowałem Twoje zgłoszenie: {loc} istnieje pilna potrzeba oddolnego rozwiązania wyzwania społecznego. "
            f"Zamiast wyważać otwarte drzwi, wyselekcjonowałem zestaw innowacji ROPS Kraków, które zostały przetestowane w Małopolsce "
            f"i posiadają wysoki wskaźnik skuteczności."
        )
        rationale = (
            "Dlaczego ten pakiet: Rekomendowane innowacje tworzą synergię – angażują zasoby sąsiedzkie (OSP, KGW, wolontariat), "
            "a jednocześnie opierają się na procedurach akceptowalnych dla samorządu terytorialnego i centrów usług społecznych."
        )
        steps = [
            "Krok 1: Zapoznaj się ze szczegółowymi kartami innowacji i podręcznikami wdrożeniowymi.",
            "Krok 2: Skonsultuj pomysł z Wirtualnym Doradcą w module Middleman JST.",
            "Krok 3: Wygeneruj wniosek grantowy w 3-krokowym Kreatorze Pomysłów."
        ]

    return {
        "ceneo_intro": intro,
        "ceneo_bundle_rationale": rationale,
        "action_steps": steps
    }

async def generate_ceneo_match_synthesis(
    problem_text: str,
    powiat: Optional[str],
    matched_innovations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generuje syntezę dopasowania w stylu inteligentnego asystenta zakupowego Ceneo:
    - Empatyczne podsumowanie problemu z emoji
    - Uzasadnienie dlaczego proponowane innowacje tworzą spójny, komplementarny koszyk
    - Natychmiastowa 3-krokowa lista działań
    """
    titles = [f"'{m['title']}' ({m['category']})" for m in matched_innovations[:4]]
    titles_str = ", ".join(titles)
    loc_str = f"w powiecie {powiat}" if powiat else "w Małopolsce"

    system_prompt = (
        "Jesteś empatycznym, fachowym doradcą Małopolskiego Hubu Innowacji Społecznych ROPS Kraków. "
        "Działasz jak nowoczesny asystent zakupowy w stylu Ceneo, który przyjaznym, profesjonalnym tonem "
        "podsumowuje problem zgłaszającego (np. 'Jasne 🤝 Zdiagnozowałem sytuację...'), "
        "wyjaśnia dlaczego polecane innowacje tworzą wzajemnie uzupełniający się 'koszyk rozwiązań' (bundle), "
        "oraz proponuje konkretne 3 ponumerowane kroki działania. "
        "Zwróć odpowiedź WYŁĄCZNIE jako obiekt JSON w formacie:\n"
        "```json\n"
        "{\n"
        '  "ceneo_intro": "Jasne 🤝 [emocjonalna diagnoza i powitanie w 2-3 zdaniach]",\n'
        '  "ceneo_bundle_rationale": "Dlaczego ten zestaw: [wyjaśnienie synergii pakietu w 2-3 zdaniach]",\n'
        '  "action_steps": [\n'
        '    "Krok 1: [krótka wskazówka]",\n'
        '    "Krok 2: [krótka wskazówka]",\n'
        '    "Krok 3: [krótka wskazówka]"\n'
        '  ]\n'
        "}\n"
        "```\n"
        "Pisz po polsku, życzliwie, profesjonalnie. Domknij poprawnie blok JSON."
    )

    user_prompt = (
        f"Problem zgłoszony: \"{problem_text}\". Lokalizacja: {loc_str}.\n"
        f"Dopasowane innowacje ROPS Kraków: {titles_str}."
    )

    raw = await groq_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=900
    )

    if raw:
        parsed = _extract_json_from_text(raw)
        if parsed and "ceneo_intro" in parsed and "ceneo_bundle_rationale" in parsed:
            steps = parsed.get("action_steps") or []
            if isinstance(steps, list) and len(steps) >= 2:
                return {
                    "ceneo_intro": parsed["ceneo_intro"],
                    "ceneo_bundle_rationale": parsed["ceneo_bundle_rationale"],
                    "action_steps": steps
                }

    return _generate_fallback_ceneo_synthesis(problem_text, powiat, matched_innovations)


async def transcribe_audio(file_bytes: bytes, filename: str = "audio.wav", language: str = "pl") -> Optional[str]:
    """
    Transkrybuje nagranie mowy na tekst za pomocą Groq Whisper (whisper-large-v3-turbo).
    Funkcja wspiera seniorów i osoby mające trudności z pisaniem na klawiaturze.
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.warning("GROQ_API_KEY brak – transkrypcja niedostępna.")
        return None

    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {"Authorization": f"Bearer {api_key}"}

    # Określ content type na podstawie rozszerzenia
    content_type = "audio/wav"
    if filename.endswith(".webm"):
        content_type = "audio/webm"
    elif filename.endswith(".mp3"):
        content_type = "audio/mpeg"
    elif filename.endswith(".ogg"):
        content_type = "audio/ogg"

    files = {"file": (filename, file_bytes, content_type)}
    data = {
        "model": "whisper-large-v3-turbo",
        "language": language,
        "temperature": "0.0"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            if resp.status_code == 200:
                result = resp.json()
                return result.get("text", "").strip()
            else:
                logger.error(f"Błąd Whisper API {resp.status_code}: {resp.text}")
                return None
    except Exception as e:
        logger.error(f"Wyjątek podczas transkrypcji Whisper: {e}")
        return None

def _generate_fallback_middleman_chat(
    user_query: str,
    municipality_name: str,
    has_cus: bool,
    latency_ms: int
) -> Dict[str, Any]:
    """Deterministyczny fallback dla czatu doradcy samorządowego ROPS."""
    q_lower = user_query.lower()
    if any(k in q_lower for k in ["rada", "radn", "uchwał", "przekon"]):
        reply = (
            f"Dla samorządu {municipality_name} kluczowym argumentem dla Radnych Gminy jest fakt, że innowacja została już "
            f"przetestowana w Małopolsce w pilotażu ROPS Kraków i nie niesie ryzyka nieudanego wdrożenia od zera. "
            f"Zamiast tworzyć kosztowny nowy etat urzędniczy, proponujemy zlecenie usługi w trybie pożytku publicznego (Ustawa o pożytku) "
            f"lub rozszerzenie zadań {'istniejącego Centrum Usług Społecznych' if has_cus else 'Ośrodka Pomocy Społecznej'}. "
            f"Koszty pilotażu mogą być w 100% sfinansowane z mikrograntu ROPS."
        )
        followups = [
            "Jak przygotować uzasadnienie finansowe do projektu uchwały?",
            "Czy możemy skorzystać ze wzoru uchwały wygenerowanego w Service Blueprint?",
            "Jakie wskaźniki przedstawić na komisji budżetowej Rady Gminy?"
        ]
    elif any(k in q_lower for k in ["finans", "fem", "środk", "pfron", "pieniądz", "grant", "budżet"]):
        reply = (
            f"Wdrożenie usługi w {municipality_name} można sfinansować z kilku komplementarnych źródeł: "
            f"1) Mikrogrant pilotażowy ROPS Kraków do 50 000 zł (100% dofinansowania na 3-6 miesięcy testów); "
            f"2) Program Fundusze Europejskie dla Małopolski 2021-2027 (Działanie 6.18 Usługi Społeczne i Zdrowotne); "
            f"3) Środki PFRON na likwidację barier i asystenturę osób z niepełnosprawnościami; "
            f"4) Gminny Program Profilaktyki i Rozwiązywania Problemów Alkoholowych (część działań integracyjnych)."
        )
        followups = [
            "Kiedy rusza najbliższy nabór grantowy w ROPS Kraków?",
            "Jaki jest wymagany wkład własny gminy?",
            "Czy wydatki na sprzęt i adaptację są w 100% kwalifikowalne w FEM?"
        ]
    elif any(k in q_lower for k in ["kadr", "etat", "kwalifikacj", "kto", "pracownik"]):
        reply = (
            f"Do uruchomienia usługi w {municipality_name} nie jest wymagane tworzenie nowego etatu urzędowego. "
            f"Standard ROPS dopuszcza umowę zlecenie lub porozumienie wolontariackie (np. 0.5 etatu koordynatora środowiskowego). "
            f"Wymagane kwalifikacje: wykształcenie średnie lub wyższe z zakresu pracy socjalnej, pedagogiki, animacji lub zdrowia publicznego. "
            f"ROPS Kraków zapewnia bezpłatne 16-godzinne szkolenie wdrożeniowe dla kadry gminy oraz komplet podręczników metodycznych."
        )
        followups = [
            "Czy ROPS wystawia certyfikaty ze szkolenia wdrożeniowego?",
            "Jak skonstruować bezpieczną umowę powierzenia zadań asystentowi?",
            "Kto odpowiada za ubezpieczenie NNW i OC wolontariusza?"
        ]
    else:
        reply = (
            f"Jako doradca ROPS Kraków rekomenduję dla {municipality_name} rozpoczęcie od formalnego powołania gminnego zespołu wdrożeniowego "
            f"(przedstawiciel wójta, kierownik {'CUS' if has_cus else 'OPS'}, lokalne NGO/OSP). "
            f"W kolejnym kroku przyjmujemy wygenerowaną uchwałę intencyjną i składamy wniosek o dofinansowanie pilotażu. "
            f"Eksperci ROPS Kraków oferują bezpłatne konsultacje prawne i operacyjne na każdym etapie adaptacji."
        )
        followups = [
            "Jak zorganizować konsultacje społeczne z mieszkańcami gminy?",
            "Jakie są kluczowe ryzyka wdrożenia w gminie wiejskiej?",
            "Czy możemy dostosować zakres wsparcia do mniejszej grupy mieszkańców?"
        ]

    return {
        "reply": reply,
        "suggested_followups": followups,
        "latency_ms": latency_ms
    }

async def middleman_consultant_chat(
    messages: List[Dict[str, str]],
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Interaktywny Asystent AI dla Wójtów, Burmistrzów i Dyrektorów CUS/OPS.
    Doradza w procedurach samorządowych, uchwałach, montażu finansowym i kadrach.
    """
    t0 = time.time()
    last_user_msg = messages[-1]["content"] if messages else "Jak wdrożyć tę innowację?"
    mun = context.get("municipality_name", "Gmina Małopolska")
    powiat = context.get("powiat", "małopolski")
    pop = context.get("population", 5000)
    sen = context.get("senior_percentage", 25.0)
    has_cus = context.get("has_cus", False)
    blueprint_sum = context.get("blueprint_summary") or ""

    system_prompt = (
        f"Jesteś starszym doradcą samorządowym Regionalnego Ośrodka Polityki Społecznej (ROPS) w Krakowie. "
        f"Prowadzisz profesjonalną konsultację wdrożeniową dla władz i kadry samorządowej: {mun} (powiat {powiat}, "
        f"mieszkańców: {pop}, seniorzy: {sen}%, CUS: {'TAK' if has_cus else 'NIE (GOPS/MOPS)'}). "
        f"Kontekst wdrożenia: {blueprint_sum[:300]}. "
        f"Odpowiadaj konkretnie, profesjonalnie, powołując się na polskie ramy prawne (Uchwała Rady Gminy, Ustawa o CUS, fundusze FEM 2021-2027). "
        "Zwróć odpowiedź WYŁĄCZNIE jako obiekt JSON w formacie:\n"
        "```json\n"
        "{\n"
        '  "reply": "[Twoja merytoryczna, fachowa odpowiedź dla wójta/dyrektora w 2-4 zwięzłych akapitach]",\n'
        '  "suggested_followups": [\n'
        '    "[Pytanie uzupełniające 1]",\n'
        '    "[Pytanie uzupełniające 2]",\n'
        '    "[Pytanie uzupełniające 3]"\n'
        '  ]\n'
        "}\n"
        "```\n"
        "Dbaj o poprawny format JSON i domknięcie klamry }."
    )

    conv_messages = [{"role": "system", "content": system_prompt}]
    for m in messages[-6:]:
        conv_messages.append({"role": m["role"], "content": m["content"]})

    raw = await groq_chat_completion(conv_messages, temperature=0.3, max_tokens=1000)
    t1 = time.time()
    latency_ms = int((t1 - t0) * 1000)

    if raw:
        parsed = _extract_json_from_text(raw)
        if parsed and "reply" in parsed:
            followups = parsed.get("suggested_followups") or []
            return {
                "reply": parsed["reply"],
                "suggested_followups": followups[:3],
                "latency_ms": latency_ms
            }

    return _generate_fallback_middleman_chat(last_user_msg, mun, has_cus, latency_ms)

