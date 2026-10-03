# Task 14: Wdrożenie Docker Compose, Auto-Seeder Danych i Test Dymny (Smoke Test)
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: DevOps, Packaging & Quality Assurance  
> **Waga w wyzwaniu**: Kluczowa dla oceny gotowości wdrożeniowej (20% oceny)  
> **Szacowany czas realizacji**: 35 minut  
> **Zależności**: Wszystkie poprzednie zadania (Task 01 - Task 13)  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Sfinalizowanie i spakowanie całego ekosystemu do niezależnego środowiska kontenerowego:
1. Utworzenie multi-stage `Dockerfile` dla frontendu (Node build -> Nginx Alpine) i backendu (Python 3.11-slim).
2. Konfiguracja `docker-compose.yml` umożliwiająca uruchomienie całego systemu jednym poleceniem: `docker compose up --build`.
3. Zapewnienie automatycznego załadowania realistycznych danych ROPS Kraków (seed runner) przy pierwszym starcie.
4. Utworzenie skryptu testu dymnego weryfikującego stan wszystkich modułów.

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/Dockerfile`
- `backend/app/seed/seed_runner.py`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `docker-compose.yml`
- `scripts/smoke_test.py`

---

## 3. Szczegóły Implementacji

### 3.1. `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY . .

# Tworzenie katalogu na wolumen bazy danych
RUN mkdir -p /data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.2. `frontend/Dockerfile` & `frontend/nginx.conf`
Multi-stage build kompilujący React SPA i serwujący go przez lekki serwer Nginx z wbudowanym proxy do backendu (`/api/v1/` -> `backend:8000/api/v1/`).

### 3.3. Automatyczny Seeder Danych (`seed_runner.py`)
Podczas startu backendu funkcja sprawdza:
```python
if count(innovations) == 0:
    load_json_data("seed/data/innovations_rops.json")
    load_json_data("seed/data/malopolska_powiaty.json")
    load_json_data("seed/data/sample_problems.json")
    logger.info("Pomyślnie załadowano realistyczne dane demonstracyjne ROPS Kraków.")
```

### 3.4. Skrypt Testu Dymnego (`scripts/smoke_test.py`)
Skrypt wykonujący automatyczne zapytania HTTP do wszystkich modułów (Health, Matchmaking, Knowledge, Ideas, Testing, Communication, Middleman, Admin) i raportujący status `PASS / FAIL`.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Wykonanie w terminalu:
   ```bash
   docker compose up --build -d
   ```
2. Otwarcie przeglądarki pod adresem `http://localhost`:
   - Aplikacja otwiera się bez błędów.
   - Na stronie głównej widoczne są innowacje ROPS.
3. Uruchomienie testu dymnego:
   ```bash
   python scripts/smoke_test.py
   ```
   Wszystkie moduły zgłaszają status `200 OK`.
