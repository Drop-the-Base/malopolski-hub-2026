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
