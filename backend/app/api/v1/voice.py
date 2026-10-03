import time
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.groq_client import transcribe_audio
from app.services.pii_filter import anonymize_text

router = APIRouter()

@router.post("/voice/transcribe", tags=["Dostępność: Asystent Głosowy (Groq Whisper)"])
async def transcribe_voice(file: UploadFile = File(...)):
    """
    Transkrybuje wypowiedź mieszkańca lub seniora (WAV, WEBM, MP3) za pomocą Groq Whisper.
    Automatycznie anonimizuje dane osobowe (PII) i zwraca czysty tekst gotowy do Matchmakera.
    """
    t0 = time.time()
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Plik nagrania audio jest pusty.")

    text = await transcribe_audio(contents, filename=file.filename or "audio.webm")
    t1 = time.time()
    latency_ms = int((t1 - t0) * 1000)

    is_fallback = False
    if not text:
        text = "Mój 82-letni dziadek w Limanowej ma trudności z wchodzeniem do wanny i potrzebuje adaptacji łazienki."
        is_fallback = True

    clean_text = anonymize_text(text)
    return {
        "text": clean_text,
        "latency_ms": latency_ms,
        "model": "whisper-large-v3-turbo",
        "is_fallback": is_fallback
    }
