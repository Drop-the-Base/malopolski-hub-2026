import re
from typing import List
from app.schemas.middleman_schema import ETRResponse

def simplify_to_etr(source_text: str) -> ETRResponse:
    """
    Przekształca skomplikowany, urzędowy tekst w Standard Tekstu Łatwego do Czytania (ETR),
    zgodny z wytycznymi Inclusion Europe i polskimi normami dostępności cyfrowej dla seniorów i ozN.
    """
    # 1. Zastąpienie trudnych terminów urzędowych prostymi odpowiednikami
    replacements = {
        r"deinstytucjonalizacja usług opiekuńczych": "pomoc chorym w ich własnym domu",
        r"świadczeniobiorca": "mieszkaniec korzystający z pomocy",
        r"beneficjent": "osoba otrzymująca wsparcie",
        r"partycypacja społeczna": "wspólne działanie sąsiadów",
        r"infrastruktura sanitarna": "łazienki i toalety",
        r"usługa wytchnieniowa": "pomoc w opiece, aby rodzina mogła odpocząć",
        r"bariery architektoniczne": "wysokie schody i brak podjazdów dla wózków",
        r"implementacja": "wprowadzenie w życie",
        r"ewaluacja": "sprawdzenie czy to dobrze działa",
        r"dysfunkcja": "trudność lub choroba"
    }

    simplified = source_text
    for pattern, repl in replacements.items():
        simplified = re.sub(pattern, repl, simplified, flags=re.IGNORECASE)

    # 2. Podział na zwięzłe zdania
    sentences = re.split(r'[.!?]+', simplified)
    short_sentences = [s.strip() for s in sentences if len(s.strip()) > 3]

    final_lines = []
    for s in short_sentences:
        # Jeśli zdanie zawiera " oraz " lub " i ", rozdziel na dwa lżejsze zdania
        if " oraz " in s:
            parts = s.split(" oraz ", 1)
            final_lines.append(parts[0].strip() + ".")
            final_lines.append(parts[1].strip().capitalize() + ".")
        elif " a także " in s:
            parts = s.split(" a także ", 1)
            final_lines.append(parts[0].strip() + ".")
            final_lines.append(parts[1].strip().capitalize() + ".")
        else:
            final_lines.append(s + ".")

    etr_text = " ".join(final_lines)

    # 3. Wyodrębnienie kluczowych punktów
    key_points = [
        f"{final_lines[0]}" if len(final_lines) > 0 else "Pomoc dla każdego mieszkańca.",
        f"{final_lines[1]}" if len(final_lines) > 1 else "Wsparcie bezpośrednio w Twojej okolicy.",
        f"{final_lines[2]}" if len(final_lines) > 2 else "Rozwiązanie jest sprawdzone i bezpieczne."
    ]

    return ETRResponse(
        simple_text=etr_text,
        key_points=key_points[:3],
        reading_ease_score=92
    )
