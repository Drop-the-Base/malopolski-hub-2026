# Task 01: Inicjalizacja Repozytorium i Struktury Projektu (Scaffolding)
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: DevOps & Project Setup  
> **Szacowany czas realizacji**: 20 minut  
> **Zależności**: Brak  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Utworzenie szkieletu całego repozytorium z podziałem na część serwerową (`backend/`), interfejs użytkownika (`frontend/`), konfigurację kontenerów oraz pliki środowiskowe.

---

## 2. Zakres Prac i Pliki do Utworzenia

### 2.1. Pliki Konfiguracyjne Korzenia Projektu
- `.gitignore`: Ignorowanie wirtualnych środowisk Python (`.venv/`, `__pycache__/`, `*.pyc`), `node_modules/`, `dist/`, baz danych (`*.db`), folderu `.env`.
- `.env.example`: Wzorzec zmiennych środowiskowych dla backendu i frontendu.

### 2.2. Szkielet Katalogów
Utworzyć następującą strukturę katalogów:
```
backend/
├── app/
│   ├── api/v1/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── seed/data/
├── tests/
├── requirements.txt
└── Dockerfile

frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── accessibility/
│   │   ├── canvas/
│   │   ├── common/
│   │   ├── layout/
│   │   └── map/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── styles/
│   └── views/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── Dockerfile
```

---

## 3. Szczegóły Implementacji

### 3.1. `.gitignore`
Musi zawierać reguły dla:
- Python: `__pycache__/`, `*.py[cod]`, `.venv`, `env/`, `.pytest_cache/`, `*.egg-info/`
- Node: `node_modules/`, `dist/`, `.vite/`, `npm-debug.log*`
- Bazy i dane: `*.db`, `*.sqlite3`, `data/`, `data/vector_store/`
- Środowisko: `.env`, `.env.local`
- Systemowe: `.DS_Store`, `Thumbs.db`

### 3.2. `.env.example`
```env
# Konfiguracja Ogólna
APP_ENV=development
PROJECT_NAME="Malopolski Hub Innowacji Spolecznych"
DEBUG=true

# Bezpieczeństwo i Baza Danych
SECRET_KEY=change-this-in-production-super-secret-key-32chars
DATABASE_URL=sqlite+aiosqlite:///./data/mhis.db
VECTOR_STORE_DIR=./data/vector_store

# Integracje AI (Opcjonalne - system ma fallback lokalny)
GEMINI_API_KEY=
OPENAI_API_KEY=

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:80"]

# Frontend (Vite)
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Wszystkie katalogi istnieją.
2. Pliki `.gitignore` oraz `.env.example` znajdują się w katalogu głównym projektu.
3. Sprawdzenie poprawności struktury poleceniem w shellu:
   ```bash
   dir /s /b backend frontend
   ```
