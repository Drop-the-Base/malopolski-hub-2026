import json
import os
import logging
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.innovation import Innovation
from app.models.regional_stat import RegionalStat
from app.models.testing import TestingCampaign
from app.models.communication import Mentor, CommunicationThread, ThreadMessage
from app.models.problem_report import ProblemReport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mhis_seeder")

SEED_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SEED_DIR, "data")

async def run_seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Innowacje ROPS
        count_res = await session.execute(select(func.count(Innovation.id)))
        count = count_res.scalar()
        if count == 0:
            innovations_file = os.path.join(DATA_DIR, "innovations_rops.json")
            if os.path.exists(innovations_file):
                with open(innovations_file, "r", encoding="utf-8") as f:
                    innovations_data = json.load(f)
                    for item in innovations_data:
                        session.add(Innovation(**item))
                logger.info(f"Załadowano {len(innovations_data)} innowacji ROPS.")

        # 2. Powiaty Małopolski
        count_pow = await session.execute(select(func.count(RegionalStat.powiat_code)))
        if count_pow.scalar() == 0:
            powiaty_file = os.path.join(DATA_DIR, "malopolska_powiaty.json")
            if os.path.exists(powiaty_file):
                with open(powiaty_file, "r", encoding="utf-8") as f:
                    powiaty_data = json.load(f)
                    for item in powiaty_data:
                        session.add(RegionalStat(**item))
                logger.info(f"Załadowano {len(powiaty_data)} powiatów Małopolski.")

        # 3. Kampanie testowe
        count_camp = await session.execute(select(func.count(TestingCampaign.id)))
        if count_camp.scalar() == 0:
            camp_file = os.path.join(DATA_DIR, "sample_campaigns.json")
            if os.path.exists(camp_file):
                with open(camp_file, "r", encoding="utf-8") as f:
                    camp_data = json.load(f)
                    for item in camp_data:
                        # Konwersja daty
                        from datetime import datetime
                        item_copy = dict(item)
                        if "deadline" in item_copy:
                            item_copy["deadline"] = datetime.strptime(item_copy["deadline"], "%Y-%m-%d").date()
                        session.add(TestingCampaign(**item_copy))
                logger.info(f"Załadowano {len(camp_data)} kampanii testowych.")

        # 4. Mentorzy
        count_mentors = await session.execute(select(func.count(Mentor.id)))
        if count_mentors.scalar() == 0:
            mentors_file = os.path.join(DATA_DIR, "sample_mentors.json")
            if os.path.exists(mentors_file):
                with open(mentors_file, "r", encoding="utf-8") as f:
                    mentors_data = json.load(f)
                    for item in mentors_data:
                        session.add(Mentor(**item))
                logger.info(f"Załadowano {len(mentors_data)} mentorów.")

        # 5. Przykładowe problemy
        count_prob = await session.execute(select(func.count(ProblemReport.id)))
        if count_prob.scalar() == 0:
            prob_file = os.path.join(DATA_DIR, "sample_problems.json")
            if os.path.exists(prob_file):
                with open(prob_file, "r", encoding="utf-8") as f:
                    prob_data = json.load(f)
                    for item in prob_data:
                        session.add(ProblemReport(**item))
                logger.info(f"Załadowano {len(prob_data)} problemów referencyjnych.")

        # 6. Wstępny wątek dyskusyjny
        count_threads = await session.execute(select(func.count(CommunicationThread.id)))
        if count_threads.scalar() == 0:
            init_thread = CommunicationThread(
                id="thread-001",
                title="Poszukujemy partnera JST z Małopolski do projektu opieki wytchnieniowej",
                category="poszukiwanie_partnera",
                author_name="Fundacja 'Srebrny Wiek'",
                author_role="ngo",
                powiat="wadowicki",
                status="open"
            )
            session.add(init_thread)
            await session.flush()
            init_msg = ThreadMessage(
                id="msg-001",
                thread_id="thread-001",
                sender_name="Krzysztof Mazur (Fundacja)",
                sender_role="ngo",
                content="Planujemy start w naborze EFS Małopolska z innowacją 'Przystanek Wytchnienie'. Szukamy gminy wiejskiej zainteresowanej pilotażem dla 15 rodzin."
            )
            session.add(init_msg)
            logger.info("Załadowano startowy wątek dyskusyjny.")

        await session.commit()
    logger.info("Inicjalizacja danych demonstracyjnych zakończona pomyślnie.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_seed())
