import io
import wave
import struct
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

def create_dummy_wav() -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        data = struct.pack('<' + ('h' * 16000), *([0] * 16000))
        wav.writeframes(data)
    buf.seek(0)
    return buf.read()

@pytest.mark.asyncio
async def test_voice_transcribe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        wav_bytes = create_dummy_wav()
        files = {"file": ("senior_speech.wav", wav_bytes, "audio/wav")}
        res = await ac.post("/api/v1/voice/transcribe", files=files)
        assert res.status_code == 200
        data = res.json()
        assert "text" in data
        assert "latency_ms" in data
        assert len(data["text"]) > 0
