import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.seed.seed_runner import run_seed

# Routery
from app.api.v1.health import router as health_router
from app.api.v1.matchmaking import router as matchmaking_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.ideas import router as ideas_router
from app.api.v1.middleman import router as middleman_router
from app.api.v1.testing import router as testing_router
from app.api.v1.communication import router as communication_router
from app.api.v1.admin import router as admin_router
from app.api.v1.voice import router as voice_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mhis_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicjalizacja struktur bazy danych i automatyczny seed danych ROPS
    logger.info("Inicjalizacja bazy danych i tabel SQLAlchemy...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Uruchamianie seedera danych demonstracyjnych ROPS Kraków...")
    await run_seed()
    yield
    logger.info("Zamykanie zasobów aplikacji MHIS...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    ## Małopolski Hub Innowacji Społecznych (MHIS) – ROPS Kraków
    
    Oficjalny prototyp platformy integrującej mieszkańców, organizacje pozarządowe, 
    Jednostki Samorządu Terytorialnego (JST/CUS) oraz ekspertów ROPS Kraków.
    
    ### Zrealizowane Moduły:
    - **Moduł I**: Matchmaking Społeczny (RAG - wyszukiwanie hybrydowe z filtrem PII)
    - **Moduł II**: Zasobnik Wiedzy (Biblioteka Innowacji i Mapa Wyzwań 22 Powiatów)
    - **Moduł III**: Kreator Pomysłów (Fiszka 24/7, Canwa Innowacji z Asystentem AI, Generator Wniosków)
    - **Moduł IV**: Tester Innowacji (Platforma ewaluacji i badania wskaźnika SUS)
    - **Moduł V**: Platforma Aktywnej Komunikacji (Dialog z ROPS, giełda partnerstw, baza mentorów)
    - **Moduł VI**: Panel Administratora (Radar Trendów Społecznych i moderacja zgłoszeń)
    - **Moduł VII**: Middleman Innowacji dla JST (Automatyczny Service Blueprint i uchwała dla gminy)
    - **Ułatwienia WCAG**: Silnik transformacji tekstu na Standard ETR (Tekst Łatwy do Czytania)
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Konfiguracja CORS dla frontendu
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rejestracja routerów pod prefiksem /api/v1
app.include_router(health_router, prefix="/api/v1")
app.include_router(matchmaking_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(ideas_router, prefix="/api/v1")
app.include_router(middleman_router, prefix="/api/v1")
app.include_router(testing_router, prefix="/api/v1")
app.include_router(communication_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1")

@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "organization": "Regionalny Ośrodek Polityki Społecznej w Krakowie (ROPS)",
        "docs_url": "/docs",
        "api_v1_prefix": "/api/v1",
        "status": "online",
        "wcag_level": "WCAG 2.1 AA",
        "modules_active": [
            "I. Matchmaking Społeczny (RAG)",
            "II. Zasobnik Wiedzy",
            "III. Kreator Pomysłów (Canwa Innowacji)",
            "IV. Tester Innowacji (SUS Score)",
            "V. Platforma Aktywnej Komunikacji",
            "VI. Panel Administratora (Radar Trendów)",
            "VII. Middleman Innowacji dla JST",
            "Udogodnienia WCAG & Standard ETR"
        ]
    }
