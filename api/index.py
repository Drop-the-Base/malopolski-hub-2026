"""Punkt wejścia Vercel (Python serverless): udostępnia aplikację FastAPI z katalogu backend/."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))

# System plików funkcji jest tylko do odczytu poza /tmp – baza demo jest tam tworzona i seedowana przy zimnym starcie
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:////tmp/mhis.db")
os.environ.setdefault("VECTOR_STORE_DIR", "/tmp/vector_store")
os.environ.setdefault("APP_ENV", "production")

from app.main import app  # noqa: E402,F401
