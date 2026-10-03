"""Słowniki domenowe współdzielone przez API: powiaty Małopolski i kategorie innowacji."""
import unicodedata
from typing import Optional

# Nazwa powiatu (tak jak w bazie / seedzie) -> forma w miejscowniku (do zdań "w powiecie ...")
POWIATY_LOCATIVE = {
    "bocheński": "w powiecie bocheńskim",
    "brzeski": "w powiecie brzeskim",
    "chrzanowski": "w powiecie chrzanowskim",
    "dąbrowski": "w powiecie dąbrowskim",
    "gorlicki": "w powiecie gorlickim",
    "krakowski": "w powiecie krakowskim",
    "limanowski": "w powiecie limanowskim",
    "miechowski": "w powiecie miechowskim",
    "myślenicki": "w powiecie myślenickim",
    "nowosądecki": "w powiecie nowosądeckim",
    "nowotarski": "w powiecie nowotarskim",
    "olkuski": "w powiecie olkuskim",
    "oświęcimski": "w powiecie oświęcimskim",
    "proszowicki": "w powiecie proszowickim",
    "suski": "w powiecie suskim",
    "tarnowski": "w powiecie tarnowskim",
    "tatrzański": "w powiecie tatrzańskim",
    "wadowicki": "w powiecie wadowickim",
    "wielicki": "w powiecie wielickim",
    "m. Kraków": "w Krakowie",
    "m. Nowy Sącz": "w Nowym Sączu",
    "m. Tarnów": "w Tarnowie",
}

POWIATY = list(POWIATY_LOCATIVE.keys())

CATEGORY_LABELS = {
    "seniorzy": "Seniorzy",
    "dostepnosc": "Dostępność",
    "zdrowie_psychiczne": "Zdrowie psychiczne",
    "wykluczenie_cyfrowe": "Wykluczenie cyfrowe",
    "edukacja": "Edukacja i integracja sensoryczna",
    "uslugi_opiekuncze": "Usługi opiekuńcze",
    "integracja": "Integracja sąsiedzka",
    "usamodzielnienie": "Usamodzielnienie",
}

CATEGORIES = list(CATEGORY_LABELS.keys())


def strip_diacritics(text: str) -> str:
    """Zamienia polskie znaki na ich odpowiedniki ASCII (ł -> l, ą -> a, ...)."""
    text = text.replace("ł", "l").replace("Ł", "L")
    return "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))


def normalize_powiat(value: Optional[str]) -> Optional[str]:
    """Dopasowuje powiat bez względu na wielkość liter, polskie znaki i przedrostek 'powiat'."""
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    key = strip_diacritics(raw.lower()).removeprefix("powiat ").strip()
    for name in POWIATY:
        if strip_diacritics(name.lower()) == key or strip_diacritics(name.lower()) == f"m. {key}":
            return name
    raise ValueError(f"Nieznany powiat: '{value}'. Dozwolone: {', '.join(POWIATY)}")


def normalize_category(value: Optional[str]) -> Optional[str]:
    if value is None or not value.strip():
        return None
    if value not in CATEGORY_LABELS:
        raise ValueError(f"Nieznana kategoria: '{value}'. Dozwolone: {', '.join(CATEGORIES)}")
    return value


def powiat_locative(powiat: Optional[str]) -> str:
    if not powiat:
        return "w Małopolsce"
    if powiat in POWIATY_LOCATIVE:
        return POWIATY_LOCATIVE[powiat]
    try:
        return POWIATY_LOCATIVE[normalize_powiat(powiat)]
    except (ValueError, KeyError):
        return f"w miejscowości {powiat}"


def category_label(category: Optional[str]) -> str:
    if not category:
        return "Ogólne"
    return CATEGORY_LABELS.get(category, category.replace("_", " ").capitalize())


def format_pl_number(value: float) -> str:
    """3800 -> '3 800' (polski separator tysięcy: twarda spacja)."""
    return f"{int(round(value)):,}".replace(",", " ")
