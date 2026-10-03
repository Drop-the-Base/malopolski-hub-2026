import re

PESEL_REGEX = re.compile(r'\b\d{11}\b')
PHONE_REGEX = re.compile(r'(?:\+?48)?(?:\s*\(?0?\d{2,3}\)?\s*)?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})')
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')

_UPPER = "A-ZĄĆĘŁŃÓŚŹŻ"
_LOWER = "a-ząćęłńóśźż"
_CAP_WORD = rf"[{_UPPER}][{_LOWER}]+(?:-[{_UPPER}][{_LOWER}]+)?"

# Adresy: "ul. Długa 5", "al. Mickiewicza 12/4", "os. Centrum C 3"
ADDRESS_REGEX = re.compile(
    rf"\b(?:ul\.|ulica|ulicy|al\.|aleja|alei|os\.|osiedle|osiedlu|pl\.|plac|placu)\s*"
    rf"(?:[{_UPPER}0-9][\w{_LOWER}{_UPPER}.\-]*\s+){{0,3}}\d+[a-zA-Z]?(?:\s*/\s*\d+[a-zA-Z]?)?",
    re.UNICODE,
)
POSTAL_CODE_REGEX = re.compile(r'\b\d{2}-\d{3}\b')

# Najpopularniejsze imiona (rdzenie) – pozwalają wykryć "Jan Kowalski", "Anną Nowak", "Janem Kowalskim"
_FIRST_NAME_STEMS = [
    "Jan", "Piotr", "Krzysztof", "Andrzej", "Tomasz", "Paweł", "Pawł", "Michał", "Marcin", "Stanisław",
    "Józef", "Józ", "Marek", "Grzegorz", "Adam", "Łukasz", "Zbigniew", "Jerzy", "Tadeusz", "Mateusz",
    "Dariusz", "Mariusz", "Wojciech", "Ryszard", "Jakub", "Henryk", "Robert", "Rafał", "Kazimierz",
    "Jacek", "Maciej", "Kamil", "Janusz", "Marian", "Mirosław", "Jarosław", "Sławomir", "Dawid",
    "Wiesław", "Roman", "Władysław", "Edward", "Kacper", "Szymon", "Bartosz", "Filip", "Antoni",
    "Ann", "Mari", "Katarzyn", "Małgorzat", "Agnieszk", "Barbar", "Ew", "Krystyn", "Elżbiet",
    "Zofi", "Teres", "Magdalen", "Monik", "Jadwig", "Danut", "Iren", "Halin", "Helen", "Beat",
    "Aleksandr", "Mart", "Dorot", "Marianna", "Jolant", "Iwon", "Karolin", "Bożen", "Urszul",
    "Justyn", "Renat", "Alicj", "Paulin", "Sylwi", "Natali", "Wand", "Agat", "Stanisław", "Genowef",
    "Kamil", "Grażyn", "Ewelin", "Edyt", "Wiesław", "Weronik", "Julia", "Juli", "Lucyn", "Emili",
]
_FIRST_NAME_ALT = "|".join(sorted({re.escape(s) for s in _FIRST_NAME_STEMS}, key=len, reverse=True))
NAME_REGEX = re.compile(
    rf"\b(?:{_FIRST_NAME_ALT})[{_LOWER}]{{0,4}}\s+{_CAP_WORD}\b",
    re.UNICODE,
)
# "pan Kowalski", "pani Nowak", "panią Wiśniewską"
TITLE_NAME_REGEX = re.compile(
    rf"\b(?:[Pp]an|[Pp]ani|[Pp]ana|[Pp]anu|[Pp]anią|[Pp]anem)\s+{_CAP_WORD}\b",
    re.UNICODE,
)


def anonymize_text(text: str) -> str:
    """
    Usuwa dane wrażliwe (PESEL, telefony, e-maile, adresy, imiona i nazwiska)
    zgodnie z zasadą Zero Real PII wyzwania ROPS Kraków.
    Filtr jest heurystyczny – nie zastępuje weryfikacji przez inspektora ochrony danych.
    """
    if not text:
        return ""

    clean = PESEL_REGEX.sub("[ZANONIMIZOWANY PESEL]", text)
    clean = EMAIL_REGEX.sub("[ZANONIMIZOWANY EMAIL]", clean)
    clean = PHONE_REGEX.sub("[ZANONIMIZOWANY TELEFON]", clean)
    clean = ADDRESS_REGEX.sub("[ZANONIMIZOWANY ADRES]", clean)
    clean = POSTAL_CODE_REGEX.sub("[ZANONIMIZOWANY KOD]", clean)
    clean = TITLE_NAME_REGEX.sub("[ZANONIMIZOWANA OSOBA]", clean)
    clean = NAME_REGEX.sub("[ZANONIMIZOWANA OSOBA]", clean)
    return clean
