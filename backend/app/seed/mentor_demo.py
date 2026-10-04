"""Dane demonstracyjne panelu mentora (G15): przydział dwóch startowych fiszek i pytania do ekspertów w Dialogu.

Uruchamiane raz na bazę (znacznik w `app_state`), więc decyzje koordynatora (np. zdjęcie przydziału) nie są nadpisywane.
"""
import logging
from datetime import datetime
from app.core.database import AsyncSessionLocal
from app.models.app_state import AppState
from app.models.communication import CommunicationThread, Mentor, ThreadMessage
from app.models.idea_fiszka import IdeaFiszka

logger = logging.getLogger("mhis_seeder")

MARKER = "seed_mentor_demo_v1"
DEMO_ASSIGNMENTS = {"fiszka-sen-01": "mentor-001", "fiszka-mlo-03": "mentor-003"}
DEMO_THREADS = [
    {
        "thread": dict(
            id="thread-002",
            title="Jak przygotować urząd gminy na klientów z niepełnosprawnościami?",
            category="konsultacja_mentorska",
            author_name="Urząd Gminy Słaboszów",
            author_role="jst",
            powiat="miechowski",
            status="open",
        ),
        "message": dict(
            id="msg-002",
            sender_name="Referat spraw obywatelskich",
            sender_role="jst",
            content=("Chcemy w tym roku poprawić dostępność urzędu: wejście, obsługa osób niewidomych i z afazją. "
                     "Od czego zacząć przy małym budżecie i bez architekta na etacie?"),
        ),
    },
    {
        "thread": dict(
            id="thread-003",
            title="Czy opieka wytchnieniowa dla seniorów może być finansowana z naboru EFS?",
            category="rops_qa",
            author_name="GOPS Gorlice",
            author_role="jst",
            powiat="gorlicki",
            status="open",
        ),
        "message": dict(
            id="msg-003",
            sender_name="Kierowniczka GOPS",
            sender_role="jst",
            content=("Mamy 12 rodzin opiekujących się seniorami po udarze. Szukamy partnera NGO i źródła finansowania "
                     "na pilotaż opieki wytchnieniowej. Jakie warunki trzeba spełnić?"),
        ),
    },
]


async def seed_mentor_demo() -> None:
    async with AsyncSessionLocal() as session:
        if await session.get(AppState, MARKER):
            return
        for fiszka_id, mentor_id in DEMO_ASSIGNMENTS.items():
            fiszka = await session.get(IdeaFiszka, fiszka_id)
            if fiszka and not fiszka.assigned_mentor_id and await session.get(Mentor, mentor_id):
                fiszka.assigned_mentor_id = mentor_id
                fiszka.review_started_at = fiszka.review_started_at or datetime.utcnow()
        for item in DEMO_THREADS:
            if await session.get(CommunicationThread, item["thread"]["id"]):
                continue
            session.add(CommunicationThread(**item["thread"]))
            await session.flush()
            session.add(ThreadMessage(thread_id=item["thread"]["id"], **item["message"]))
        session.add(AppState(key=MARKER, value=datetime.utcnow().isoformat()))
        await session.commit()
        logger.info("Załadowano dane demonstracyjne panelu mentora.")
