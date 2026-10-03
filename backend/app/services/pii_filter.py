import re

PESEL_REGEX = re.compile(r'\b\d{11}\b')
PHONE_REGEX = re.compile(r'(?:\+?48)?(?:\s*\(?0?\d{2,3}\)?\s*)?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})')
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')

def anonymize_text(text: str) -> str:
    """
    Usuwa dane wrażliwe (PESEL, numery telefonów, adresy e-mail)
    zgodnie z zasadą Zero Real PII wyzwania ROPS Kraków.
    """
    if not text:
        return ""
    
    clean = PESEL_REGEX.sub("[ZANONIMIZOWANY PESEL]", text)
    clean = EMAIL_REGEX.sub("[ZANONIMIZOWANY EMAIL]", clean)
    clean = PHONE_REGEX.sub("[ZANONIMIZOWANY TELEFON]", clean)
    return clean
