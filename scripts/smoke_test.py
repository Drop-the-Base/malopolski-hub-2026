import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint(name: str, method: str, path: str, payload: dict = None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"} if payload else {},
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

def run_smoke_tests():
    print("=" * 60)
    print("SMOKE TEST: Małopolski Hub Innowacji Społecznych (ROPS Kraków)")
    print("=" * 60)

    success_count = 0
    total_tests = 7

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

    # 6. Moduł VII: Middleman Innowacji dla JST
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

    # 7. Moduł VI: Panel Admina & Radar Trendów
    ok, _ = test_endpoint("Moduł VI: Radar Trendów ROPS", "GET", "/admin/trends")
    if ok: success_count += 1

    print("=" * 60)
    print(f"Wynik Testu Dymnego: {success_count} / {total_tests} testów zaliczonych pomyślnie.")
    print("=" * 60)

    if success_count == total_tests:
        print("WSZYSTKIE MODUŁY WYMAGANE PRZEZ ROPS KRAKÓW DZIAŁAJĄ POPRAWNIE!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_smoke_tests()
