"""Komunikaty walidacji po polsku, prostym językiem (WCAG 3.3.1 / 3.3.3).

Pydantic zwraca komunikaty po angielsku z technicznymi szczegółami (np. wyrażenie regularne adresu e-mail).
Tu zamieniamy je na zdania zrozumiałe dla mieszkańca: nazwa pola tak, jak w formularzu, i co poprawić.
"""
from typing import Any, Dict

# Nazwy pól tak, jak widzi je użytkownik w formularzach
FIELD_LABELS: Dict[str, str] = {
    "title": "Tytuł",
    "idea_title": "Tytuł pomysłu",
    "summary": "Opis",
    "problem": "Problem",
    "problem_description": "Opis problemu",
    "description": "Opis",
    "value_proposition": "Co zmieni Twój pomysł",
    "target_audience": "Dla kogo",
    "target_group": "Dla kogo",
    "target_groups": "Dla kogo",
    "author_name": "Imię i nazwisko",
    "author_email": "Adres e-mail",
    "author_type": "Kim jesteś",
    "author_role": "Rola",
    "applicant_name": "Wnioskodawca",
    "requester_name": "Imię i nazwisko",
    "requester_email": "Adres e-mail",
    "reporter_name": "Imię i nazwisko",
    "tester_name": "Imię i nazwisko",
    "tester_email": "Adres e-mail",
    "tester_role": "Rola",
    "contact_email": "Adres e-mail",
    "email": "Adres e-mail",
    "sender_name": "Podpis",
    "sender_role": "Rola",
    "content": "Treść wiadomości",
    "initial_message": "Pierwsza wiadomość",
    "body": "Treść wiadomości",
    "message": "Wiadomość",
    "topic": "Temat",
    "prompt": "Opis pomysłu",
    "text": "Tekst",
    "powiat": "Powiat",
    "gmina": "Gmina",
    "municipality_name": "Nazwa gminy",
    "category": "Obszar",
    "categories": "Obszary",
    "topics": "Tematy",
    "population": "Liczba mieszkańców",
    "senior_percentage": "Odsetek seniorów",
    "annual_budget_pln": "Budżet roczny",
    "requested_budget_pln": "Wnioskowana kwota",
    "rating": "Ocena",
    "improvement_proposal": "Propozycja usprawnienia",
    "improvement_proposals": "Propozycje usprawnień",
    "identified_barriers": "Napotkane trudności",
    "motivation": "Dlaczego chcesz testować",
    "rodo_consent": "Zgoda na przetwarzanie danych",
    "guardian_consent": "Zgoda opiekuna",
    "implementation_stage": "Etap realizacji",
    "admin_notes": "Komentarz dla autora",
    "status": "Status",
    "password": "Hasło",
    "username": "Login",
    "page_size": "Liczba wyników na stronie",
    "page": "Numer strony",
}

EMAIL_FIELDS = {"author_email", "requester_email", "tester_email", "contact_email", "email"}


def _chars(n: Any) -> str:
    """Odmiana słowa „znak”: 1 znak, 2–4 znaki, 5+ znaków (12–14 znaków)."""
    try:
        n = int(n)
    except (TypeError, ValueError):
        return f"{n} znaków"
    if n == 1:
        return "1 znak"
    if n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14):
        return f"{n} znaki"
    return f"{n} znaków"


def field_label(loc: tuple) -> str:
    parts = [str(p) for p in loc if p not in ("body", "query", "path") and not isinstance(p, int)]
    key = parts[-1] if parts else ""
    return FIELD_LABELS.get(key, key.replace("_", " ").capitalize() if key else "")


def polish_message(err: Dict[str, Any]) -> str:
    """Jedno zdanie po polsku dla pojedynczego błędu walidacji pydantic."""
    loc = tuple(err.get("loc", ()))
    key = next((str(p) for p in reversed(loc) if not isinstance(p, int)), "")
    label = field_label(loc)
    field = f"„{label}”" if label else "To pole"
    ctx = err.get("ctx") or {}
    kind = err.get("type", "")

    if kind == "missing":
        return f"Uzupełnij pole {field}."
    if kind == "string_too_short":
        return f"Pole {field} jest za krótkie – wpisz co najmniej {_chars(ctx.get('min_length'))}."
    if kind == "string_too_long":
        return f"Pole {field} jest za długie – wpisz najwyżej {_chars(ctx.get('max_length'))}."
    if kind == "string_pattern_mismatch":
        if key in EMAIL_FIELDS:
            return "Wpisz poprawny adres e-mail, np. jan.kowalski@poczta.pl."
        return f"Pole {field} ma nieprawidłowy format."
    if kind in ("greater_than_equal", "greater_than"):
        return f"Wartość w polu {field} jest za mała (najmniej {ctx.get('ge', ctx.get('gt'))})."
    if kind in ("less_than_equal", "less_than"):
        return f"Wartość w polu {field} jest za duża (najwyżej {ctx.get('le', ctx.get('lt'))})."
    if kind in ("int_parsing", "int_type", "float_parsing", "float_type", "int_from_float"):
        return f"W polu {field} wpisz liczbę."
    if kind in ("too_short",):
        return f"W polu {field} wybierz co najmniej {ctx.get('min_length', 1)} pozycję."
    if kind in ("too_long",):
        return f"W polu {field} jest za dużo pozycji (najwyżej {ctx.get('max_length')})."
    if kind in ("literal_error", "enum"):
        return f"W polu {field} wybierz jedną z dostępnych opcji."
    if kind in ("bool_parsing", "bool_type"):
        return f"Zaznacz lub odznacz pole {field}."
    if kind == "value_error":
        # Własne walidatory w schematach mają już polskie komunikaty
        return str(err.get("msg", "")).removeprefix("Value error, ") or f"Sprawdź pole {field}."
    if kind in ("json_invalid", "model_attributes_type", "dict_type"):
        return "Nie udało się odczytać danych z formularza. Odśwież stronę i spróbuj ponownie."
    return f"Sprawdź pole {field}."
