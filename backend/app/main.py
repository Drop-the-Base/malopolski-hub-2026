import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.core.validation_messages import polish_message
from app.core.database import engine, Base, AsyncSessionLocal
from app.seed.seed_runner import run_seed
import app.models  # noqa: F401 – rejestracja wszystkich modeli w metadanych

# Routery
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.matchmaking import router as matchmaking_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.ideas import router as ideas_router
from app.api.v1.middleman import router as middleman_router
from app.api.v1.testing import router as testing_router
from app.api.v1.communication import router as communication_router
from app.api.v1.admin import router as admin_router
from app.api.v1.voice import router as voice_router
from app.api.v1.problems import router as problems_router
from app.api.v1.cases import router as cases_router
from app.api.v1.subscriptions import router as subscriptions_router
from app.api.v1.admin_content import router as admin_content_router
from app.api.v1.mentor import router as mentor_router
from app.api.v1.compare import router as compare_router
from app.api.v1.open_data import router as open_data_router, open_data_cors

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mhis_app")


def migrate_sqlite_columns(connection):
    """
    Lekka migracja dla SQLite: create_all() nie zmienia istniejących tabel, więc dodajemy brakujące kolumny
    na podstawie modeli. (Docelowo: PostgreSQL + Alembic.)
    """
    if connection.dialect.name != "sqlite":
        return
    for table in Base.metadata.sorted_tables:
        existing = {row[1] for row in connection.execute(text(f"PRAGMA table_info({table.name})")).fetchall()}
        if not existing:
            continue
        for column in table.columns:
            if column.name in existing:
                continue
            col_type = column.type.compile(dialect=connection.dialect)
            default = ""
            if column.default is not None and column.default.is_scalar:
                value = column.default.arg
                default = f" DEFAULT {int(value) if isinstance(value, bool) else repr(value)}"
            logger.info(f"Migracja: dodawanie kolumny {table.name}.{column.name} ({col_type})")
            connection.execute(text(f"ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type}{default}"))


async def startup_self_test():
    """Uruchamia jedno dopasowanie matchmakingu, aby błąd schematu/indeksu wyszedł przy starcie, a nie na demo."""
    from app.services.matchmaking_service import populate_vector_store_if_needed, rank_innovations
    async with AsyncSessionLocal() as session:
        await populate_vector_store_if_needed(session)
    ranked, _ = rank_innovations("Samotni seniorzy na wsi nie mają dojazdu do lekarza", None, 3)
    if not ranked:
        logger.error("SELF-TEST: matchmaking nie zwrócił wyników dla zapytania kontrolnego!")
    else:
        logger.info(f"SELF-TEST matchmaking OK: {ranked[0]['meta']['title']} ({ranked[0]['score']})")


_initialized = False
_init_lock = asyncio.Lock()


async def ensure_initialized():
    """Tabele, migracja kolumn, seed i self-test – raz na proces (przy starcie lub przy pierwszym żądaniu)."""
    global _initialized
    if _initialized:
        return
    async with _init_lock:
        if _initialized:
            return
        logger.info("Inicjalizacja bazy danych i tabel SQLAlchemy...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.run_sync(migrate_sqlite_columns)
        logger.info("Uruchamianie seedera danych demonstracyjnych...")
        await run_seed()
        await startup_self_test()
        _initialized = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_initialized()
    yield
    logger.info("Zamykanie zasobów aplikacji MHIS...")
    from app.services.webhook_service import drain
    await drain()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    ## Małopolski Hub Innowacji Społecznych (MHIS) – prototyp HackYeah 2026

    Koncepcja platformy dla ROPS Kraków integrującej mieszkańców, organizacje pozarządowe,
    jednostki samorządu terytorialnego (JST/CUS) oraz ekspertów.

    ### Moduły:
    - **Moduł I**: Matchmaking Społeczny (ranking hybrydowy: rozpoznane potrzeby + TF-IDF, filtr PII, uzasadnienia LLM)
    - **Moduł II**: Zasobnik Wiedzy (Biblioteka Innowacji i Mapa Wyzwań 22 powiatów)
    - **Moduł III**: Kreator Pomysłów (fiszka 24/7 ze śledzeniem statusu, Canwa z autouzupełnianiem LLM, szkic wniosku)
    - **Moduł IV**: Tester Innowacji (zapisy na testy, kwestionariusz SUS – 10 pytań)
    - **Moduł V**: Platforma Aktywnej Komunikacji (wątki, rezerwacja konsultacji z mentorami)
    - **Moduł VI**: Panel Administratora (logowanie, moderacja fiszek z odpowiedzią do autora, powiadomienia, edycja katalogu)
    - **Moduł VII**: Middleman dla JST (projekt pakietu wdrożeniowego i uchwały – do weryfikacji prawnej)
    """,
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def init_on_first_request(request: Request, call_next):
    """Środowiska serverless (Vercel) nie zawsze wywołują lifespan – inicjalizujemy przy pierwszym żądaniu."""
    await ensure_initialized()
    return await call_next(request)


# Otwarte dane: CORS dla dowolnej domeny (tylko GET, bez poświadczeń) – middleware zewnętrzny wobec CORSMiddleware
app.middleware("http")(open_data_cors)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Czytelne komunikaty walidacji po polsku (pole + co poprawić) bez zrzucania danych wejściowych."""
    errors = []
    for err in exc.errors():
        field = ".".join(str(p) for p in err.get("loc", []) if p not in ("body", "query", "path"))
        errors.append({"field": field, "message": polish_message(err)})
    # Jedno zdanie na błąd, bez powtórzeń (np. kilka pól listy z tym samym problemem)
    summary = " ".join(dict.fromkeys(e["message"] for e in errors))
    return JSONResponse(status_code=422, content={"detail": summary, "errors": errors})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Szczegóły błędu trafiają do logów serwera – klient dostaje ogólny komunikat (bez SQL i parametrów)."""
    logger.exception(f"Nieobsłużony błąd {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Wystąpił błąd serwera. Spróbuj ponownie za chwilę lub skontaktuj się z administratorem."},
    )


# Rejestracja routerów pod prefiksem /api/v1
for router in (health_router, auth_router, matchmaking_router, knowledge_router, ideas_router, middleman_router,
               testing_router, communication_router, admin_router, voice_router, problems_router,
               cases_router, subscriptions_router,
               admin_content_router, open_data_router, mentor_router, compare_router):
    app.include_router(router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "note": "Prototyp HackYeah 2026 – koncepcja dla ROPS Kraków",
        "docs_url": "/docs",
        "api_v1_prefix": "/api/v1",
        "open_data_url": "/api/v1/open",
        "status": "online",
    }
