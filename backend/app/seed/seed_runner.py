import json
import os
import logging
from datetime import datetime
from sqlalchemy import select, func, delete, or_
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.innovation import Innovation
from app.models.regional_stat import RegionalStat
from app.models.testing import TestingCampaign
from app.models.communication import Mentor, CommunicationThread, ThreadMessage
from app.models.problem_report import ProblemReport
from app.models.idea_fiszka import IdeaFiszka

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mhis_seeder")

SEED_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SEED_DIR, "data")

# Wartości z wcześniejszych wersji seeda, których nie wolno pokazywać (placeholdery / zmyślone linki)
LEGACY_PLACEHOLDER_URLS = ("dQw4w9WgXcQ", "rops.krakow.pl/innowacje/")
LEGACY_MENTOR_DOMAIN = "@mentor-rops.pl"
QA_TEST_PREFIXES = ("TEST-QA", "QA-TEST")


def _load(name: str):
    path = os.path.join(DATA_DIR, name)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


async def run_seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Innowacje ROPS
        if (await session.execute(select(func.count(Innovation.id)))).scalar() == 0:
            data = _load("innovations_rops.json")
            for item in data:
                session.add(Innovation(**item))
            logger.info(f"Załadowano {len(data)} innowacji ROPS.")

        # 2. Powiaty Małopolski
        if (await session.execute(select(func.count(RegionalStat.powiat_code)))).scalar() == 0:
            data = _load("malopolska_powiaty.json")
            for item in data:
                session.add(RegionalStat(**item))
            logger.info(f"Załadowano {len(data)} powiatów Małopolski.")

        # 3. Kampanie testowe
        if (await session.execute(select(func.count(TestingCampaign.id)))).scalar() == 0:
            data = _load("sample_campaigns.json")
            for item in data:
                item_copy = dict(item)
                if "deadline" in item_copy:
                    item_copy["deadline"] = datetime.strptime(item_copy["deadline"], "%Y-%m-%d").date()
                session.add(TestingCampaign(**item_copy))
            logger.info(f"Załadowano {len(data)} kampanii testowych.")

        # 4. Mentorzy
        if (await session.execute(select(func.count(Mentor.id)))).scalar() == 0:
            data = _load("sample_mentors.json")
            for item in data:
                session.add(Mentor(**item))
            logger.info(f"Załadowano {len(data)} mentorów.")

        # 5. Przykładowe problemy
        if (await session.execute(select(func.count(ProblemReport.id)))).scalar() == 0:
            data = _load("sample_problems.json")
            for item in data:
                session.add(ProblemReport(**item))
            logger.info(f"Załadowano {len(data)} problemów referencyjnych.")

        # 6. Wstępny wątek dyskusyjny
        if (await session.execute(select(func.count(CommunicationThread.id)))).scalar() == 0:
            session.add(CommunicationThread(
                id="thread-001",
                title="Poszukujemy partnera JST z Małopolski do projektu opieki wytchnieniowej",
                category="poszukiwanie_partnera",
                author_name="Fundacja 'Srebrny Wiek'",
                author_role="ngo",
                powiat="wadowicki",
                status="open"
            ))
            await session.flush()
            session.add(ThreadMessage(
                id="msg-001",
                thread_id="thread-001",
                sender_name="Krzysztof Mazur (Fundacja)",
                sender_role="ngo",
                content="Planujemy start w naborze EFS Małopolska z innowacją 'Przystanek Wytchnienie'. Szukamy gminy wiejskiej zainteresowanej pilotażem dla 15 rodzin."
            ))
            logger.info("Załadowano startowy wątek dyskusyjny.")

        # 7. Startowe fiszki pomysłów (z klastrami i głosami dla modułu testera i panelu urzędnika)
        if (await session.execute(select(func.count(IdeaFiszka.id)))).scalar() == 0:
            demo_fiszkas = [
                IdeaFiszka(
                    id="fiszka-sen-01",
                    title="Sąsiedzka sieć asystentów seniora",
                    summary="Seniorzy w odległych sołectwach powiatu gorlickiego mają trudności z dojazdem do ośrodka zdrowia i apteki. Tworzymy sieć przeszkolonych sąsiadów-asystentów.",
                    target_audience="Seniorzy 70+ mieszkający samotnie i ich rodziny",
                    implementation_stage="pilotaz",
                    author_name="Stowarzyszenie 'Pomocna Dłoń'",
                    author_email="kontakt@pomocnadlon.example.org",
                    author_type="ngo",
                    powiat="gorlicki",
                    status="in_testing",
                    cluster_group="Pakiet Senioralny 2026",
                    votes_count=24,
                    admin_notes="Projekt skierowany do testów w gminach wiejskich. Rekomendacja włączenia do naboru ROPS.",
                    rodo_consent_at=datetime.utcnow()
                ),
                IdeaFiszka(
                    id="fiszka-eco-02",
                    title="Międzypokoleniowa kawiarenka naprawcza",
                    summary="Młodzież i seniorzy w gminie Miechów wspólnie naprawiają sprzęt codziennego użytku i rowery. Integracja pokoleń i mniej elektrośmieci.",
                    target_audience="Seniorzy oraz młodzież szkolna",
                    implementation_stage="prototyp",
                    author_name="Jan Kowalski (Grupa Mieszkańców)",
                    author_email="jan.kowalski@example.org",
                    author_type="mieszkaniec",
                    powiat="miechowski",
                    status="submitted",
                    cluster_group="Ekologia i Integracja",
                    votes_count=18,
                    admin_notes="Ciekawa inicjatywa oddolna, czeka na przydział mentora z obszaru animacji społecznej.",
                    rodo_consent_at=datetime.utcnow()
                ),
                IdeaFiszka(
                    id="fiszka-mlo-03",
                    title="Klubowa strefa wytchnienia i mentoringu rówieśniczego",
                    summary="Młodzież w Oświęcimiu przeżywa kryzysy emocjonalne i potrzebuje bezpiecznego miejsca do rozmowy. Strefa w domu kultury z dyżurem psychologa.",
                    target_audience="Młodzież 13–19 lat oraz rodzice",
                    implementation_stage="pomysl",
                    author_name="Anna Nowak",
                    author_email="anna.nowak@example.org",
                    author_type="mieszkaniec",
                    powiat="oświęcimski",
                    status="approved",
                    cluster_group="Zdrowie Psychiczne i Młodzież",
                    votes_count=37,
                    admin_notes="Zaakceptowano do wsparcia mentorskiego i przygotowania wniosku grantowego.",
                    rodo_consent_at=datetime.utcnow()
                )
            ]
            for f in demo_fiszkas:
                session.add(f)
            logger.info("Załadowano startowe fiszki pomysłów do głosowania i klastrów.")

        await session.commit()

    await sync_reference_data()
    logger.info("Inicjalizacja danych demonstracyjnych zakończona pomyślnie.")


async def sync_reference_data():
    """
    Naprawia dane w istniejących bazach (wolumen Dockera) bez ich kasowania:
    usuwa placeholderowe linki wideo/PDF, podmienia domenę e-maili mentorów na example.org,
    koryguje przepełnione kampanie testowe i usuwa wpisy testowe QA oznaczone prefiksem.
    """
    async with AsyncSessionLocal() as session:
        fixed = 0
        seed_story = {item["id"]: item for item in _load("innovations_rops.json")}
        for inn in (await session.execute(select(Innovation))).scalars().all():
            # Uzupełnienie historii karty (problem → efekt) w bazach utworzonych przed dodaniem tych pól
            for field in ("problem_statement", "effect_description"):
                if not getattr(inn, field) and seed_story.get(inn.id, {}).get(field):
                    setattr(inn, field, seed_story[inn.id][field])
                    fixed += 1
            for field in ("video_url", "handbook_url"):
                value = getattr(inn, field) or ""
                if any(marker in value for marker in LEGACY_PLACEHOLDER_URLS):
                    setattr(inn, field, None)
                    fixed += 1

        for mentor in (await session.execute(select(Mentor))).scalars().all():
            if mentor.contact_email.endswith(LEGACY_MENTOR_DOMAIN):
                mentor.contact_email = mentor.contact_email.replace(LEGACY_MENTOR_DOMAIN, "@example.org")
                fixed += 1

        for camp in (await session.execute(select(TestingCampaign))).scalars().all():
            if camp.slots_taken >= camp.slots_total and camp.status == "open":
                camp.slots_taken = camp.slots_total
                camp.status = "full"
                fixed += 1

        qa_filter = or_(*[IdeaFiszka.title.startswith(p) for p in QA_TEST_PREFIXES])
        fixed += (await session.execute(delete(IdeaFiszka).where(qa_filter))).rowcount or 0
        msg_filter = or_(*[ThreadMessage.content.startswith(p) for p in QA_TEST_PREFIXES])
        fixed += (await session.execute(delete(ThreadMessage).where(msg_filter))).rowcount or 0

        await session.commit()
        if fixed:
            logger.info(f"Skorygowano {fixed} rekordów danych referencyjnych.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_seed())
