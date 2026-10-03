import sys
import json
import urllib.request
import urllib.error
import os

# Zabezpieczenie przed błędem charmap w terminalu Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint(name: str, method: str, path: str, payload: dict = None, token: str = None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={**({"Content-Type": "application/json"} if payload else {}),
                 **({"Authorization": f"Bearer {token}"} if token else {})},
        method=method
    )
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = json.loads(response.read().decode("utf-8"))
            print(f"[PASS] {name} ({method} {path}) -> HTTP {status}")
            return True, body
    except urllib.error.HTTPError as e:
        print(f"[FAIL] {name} ({method} {path}) -> HTTP {e.code}: {e.read().decode('utf-8')}")
        return False, None
    except Exception as e:
        print(f"[ERROR] {name} ({method} {path}) -> {str(e)}")
        return False, None

def test_voice_endpoint():
    import io, wave, struct
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        data = struct.pack('<' + ('h'*16000), *([0]*16000))
        wav.writeframes(data)
    buf.seek(0)
    wav_bytes = buf.read()

    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="senior_test.wav"\r\n'
        f"Content-Type: audio/wav\r\n\r\n"
    ).encode("utf-8") + wav_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/voice/transcribe",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"[PASS] Asystent Głosowy Seniora: Groq Whisper (POST /voice/transcribe) -> HTTP {resp.getcode()}")
            print(f"       -> Rozpoznana treść: \"{data.get('text')[:60]}...\" ({data.get('latency_ms')}ms)")
            return True
    except Exception as e:
        print(f"[FAIL] Asystent Głosowy: {e}")
        return False

def run_smoke_tests():
    print("=" * 60)
    print("SMOKE TEST: Małopolski Hub Innowacji Społecznych (ROPS Kraków)")
    print("=" * 60)

    success_count = 0
    total_tests = 12

    # 1. Health
    ok, _ = test_endpoint("System Healthcheck", "GET", "/health")
    if ok: success_count += 1

    # 2. Moduł I: Matchmaking
    ok, _ = test_endpoint("Moduł I: Matchmaking RAG", "POST", "/matchmaking", {
        "problem_description": "Seniorzy w naszej wsi nie mają jak dojechać do lekarza.",
        "powiat": "gorlicki"
    })
    if ok: success_count += 1

    # 3. Moduł II: Zasobnik Wiedzy
    ok, _ = test_endpoint("Moduł II: Biblioteka Innowacji", "GET", "/knowledge/innovations")
    if ok: success_count += 1

    # 4. Moduł II: Mapa Wyzwań
    ok, _ = test_endpoint("Moduł II: Mapa Wyzwań 22 Powiatów", "GET", "/knowledge/challenges")
    if ok: success_count += 1

    # 5. Moduł III: Canwa Innowacji
    ok, _ = test_endpoint("Moduł III: Audyt Canwy Innowacji", "POST", "/canvas/evaluate", {
        "problem": "Brak opieki dla seniorów w małych wsiach.",
        "target_group": "Seniorzy 70+",
        "value_proposition": "Mobilny bus wsparcia sąsiedzkiego",
        "barriers": "Brak środków własnych gminy",
        "resources": "Lokalna remiza OSP",
        "partners": "Koło Gospodyń Wiejskich",
        "testing_plan": "Miesięczny pilotaż w 2 sołectwach",
        "metrics": "Liczba 40 objętych osób, 95% zadowolenia",
        "scalability": "Skalowanie na sąsiednie gminy"
    })
    if ok: success_count += 1

    # 6. Moduł III: Groq AI Auto-Fill Canwy (Jury Fast Track)
    ok, autofill_data = test_endpoint("Moduł III: Groq AI Auto-Fill Canwy", "POST", "/canvas/autofill", {
        "prompt": "Kawiarenka naprawcza dla seniorów i młodzieży w Nowym Sączu",
        "powiat": "nowosądecki"
    })
    if ok:
        print(f"       -> AI Tytuł: {autofill_data.get('idea_title')}")
        print(f"       -> Czas generowania: {autofill_data.get('latency_ms')}ms (ai_powered: {autofill_data.get('ai_powered')})")
        success_count += 1

    # 7. Moduł VII: Middleman Innowacji dla JST
    ok, _ = test_endpoint("Moduł VII: Middleman AI Blueprint", "POST", "/middleman/adapt", {
        "innovation_id": "rops-inn-001",
        "municipality_name": "Gmina Słaboszów",
        "powiat": "miechowski",
        "population": 3800,
        "senior_percentage": 28.5,
        "annual_budget_pln": 80000,
        "has_cus": False
    })
    if ok: success_count += 1

    # 8. Moduł VI: Panel Admina & Radar Trendów
    # Panel ROPS wymaga logowania koordynatora (hasło z ADMIN_PASSWORD)
    _, login = test_endpoint("Logowanie koordynatora ROPS", "POST", "/auth/login",
                             {"password": os.environ.get("ADMIN_PASSWORD", "rops-demo-2026")})
    ok, _ = test_endpoint("Moduł VI: Radar Trendów ROPS", "GET", "/admin/trends",
                          token=(login or {}).get("access_token"))
    if ok: success_count += 1

    # 9. Asystent Głosowy Seniora (Groq Whisper)
    ok_voice = test_voice_endpoint()
    if ok_voice: success_count += 1

    # 10. Styl Ceneo: Synteza Koszyka Innowacji
    ok, ceneo_data = test_endpoint("Moduł I: Synteza Koszyka Innowacji w Stylu Ceneo", "POST", "/matchmaking", {
        "problem_description": "Mój 82-letni dziadek w Limanowej ma trudności z wchodzeniem do wanny i potrzebuje adaptacji łazienki.",
        "powiat": "limanowski"
    })
    if ok and ceneo_data and "ceneo_intro" in ceneo_data:
        print(f"       -> Diagnoza Ceneo: \"{ceneo_data.get('ceneo_intro')[:70]}...\"")
        print(f"       -> Liczba kroków działania: {len(ceneo_data.get('action_steps', []))}")
        success_count += 1

    # 11. Moduł VII: Czat z Doradcą Samorządowym ROPS AI
    ok, chat_data = test_endpoint("Moduł VII: Czat z Doradcą Samorządowym AI", "POST", "/middleman/chat", {
        "messages": [{"role": "user", "content": "Jak przekonać radnych do uchwały o innowacji?"}],
        "innovation_id": "rops-inn-001",
        "municipality_name": "Gmina Słaboszów",
        "powiat": "miechowski",
        "population": 3800,
        "senior_percentage": 28.5,
        "has_cus": False,
        "annual_budget_pln": 80000
    })
    if ok and chat_data and "reply" in chat_data:
        print(f"       -> Odpowiedź doradcy ({chat_data.get('latency_ms')}ms): \"{chat_data.get('reply')[:70]}...\"")
        print(f"       -> Sugerowane followupy: {len(chat_data.get('suggested_followups', []))}")
        success_count += 1

    # 12. Moduł VIII: Rejestr Problemów i Panel Urzędnika JST
    ok, prob_data = test_endpoint("Moduł VIII: Rejestr Problemów JST", "GET", "/problems",
                                  token=(login or {}).get("access_token"))
    if ok and prob_data is not None:
        print(f"       -> Zarejestrowanych problemów samorządowych: {len(prob_data)}")
        success_count += 1

    print("=" * 60)
    print(f"Wynik Testu Dymnego: {success_count} / {total_tests} testów zaliczonych pomyślnie.")
    print("=" * 60)

    if success_count == total_tests:
        print("WSZYSTKIE 12 MODUŁÓW I FUNKCJONALNOŚCI ROPS KRAKÓW DZIAŁAJĄ POPRAWNIE!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_smoke_tests()
