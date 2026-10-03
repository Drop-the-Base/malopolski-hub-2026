from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.innovation import Innovation
from app.models.regional_stat import RegionalStat
from app.schemas.innovation_schema import InnovationDetail, RegionalChallengeSummary, EducationalMaterial

SAMPLE_MATERIALS = [
    EducationalMaterial(
        id="mat-001",
        title="Canwa Innowacji Społecznych – Przewodnik ROPS Kraków",
        category="Metodyka",
        description="Praktyczny podręcznik modelowania innowacji w 9 krokach dla animatorów i NGO.",
        download_url="https://rops.krakow.pl/materialy/canwa-przewodnik.pdf",
        format="PDF"
    ),
    EducationalMaterial(
        id="mat-002",
        title="Jak przekształcić innowację w trwałą usługę samorządową (JST)?",
        category="Wdrożenie",
        description="Instrukcja dla wójtów, burmistrzów i dyrektorów Centrów Usług Społecznych (CUS).",
        download_url="https://rops.krakow.pl/materialy/poradnik-jst-cus.pdf",
        format="PDF"
    ),
    EducationalMaterial(
        id="mat-003",
        title="Standardy Dostępności Cyfrowej WCAG 2.1 AA w jednostkach pomocy społecznej",
        category="Dostępność",
        description="Wytyczne dotyczące tworzenia piktogramów, tekstów ETR i obsługi seniorów z niepełnosprawnościami.",
        download_url="https://rops.krakow.pl/materialy/standard-wcag-etr.pdf",
        format="PDF"
    )
]

async def get_innovations(
    db: AsyncSession,
    category: Optional[str] = None,
    target_group: Optional[str] = None,
    search: Optional[str] = None
) -> List[InnovationDetail]:
    query = select(Innovation).where(Innovation.is_published == True)
    if category:
        query = query.where(Innovation.category == category)
    
    result = await db.execute(query)
    items = result.scalars().all()

    output = []
    for item in items:
        # Filtrowanie po wyszukiwanym tekście
        if search:
            s_lower = search.lower()
            if s_lower not in item.title.lower() and s_lower not in item.full_description.lower():
                continue
        # Filtrowanie po grupie docelowej
        if target_group and target_group not in (item.target_groups or []):
            continue

        output.append(
            InnovationDetail(
                id=item.id,
                title=item.title,
                tagline=item.tagline,
                category=item.category,
                target_groups=item.target_groups or [],
                full_description=item.full_description,
                readiness_level=item.readiness_level,
                budget_bracket=item.budget_bracket or "Średni",
                video_url=item.video_url,
                handbook_url=item.handbook_url,
                etr_summary=item.etr_summary,
                origin_poviat=item.origin_poviat,
                is_published=item.is_published,
                created_at=item.created_at
            )
        )
    return output

async def get_innovation_by_id(db: AsyncSession, inn_id: str) -> Optional[InnovationDetail]:
    result = await db.execute(select(Innovation).where(Innovation.id == inn_id))
    item = result.scalar_one_or_none()
    if not item:
        return None
    return InnovationDetail(
        id=item.id,
        title=item.title,
        tagline=item.tagline,
        category=item.category,
        target_groups=item.target_groups or [],
        full_description=item.full_description,
        readiness_level=item.readiness_level,
        budget_bracket=item.budget_bracket or "Średni",
        video_url=item.video_url,
        handbook_url=item.handbook_url,
        etr_summary=item.etr_summary,
        origin_poviat=item.origin_poviat,
        is_published=item.is_published,
        created_at=item.created_at
    )

async def get_regional_challenges(db: AsyncSession) -> List[RegionalChallengeSummary]:
    result = await db.execute(select(RegionalStat).order_by(RegionalStat.powiat_name))
    stats = result.scalars().all()
    return [
        RegionalChallengeSummary(
            powiat_code=s.powiat_code,
            powiat_name=s.powiat_name,
            population=s.population,
            senior_share_pct=s.senior_share_pct,
            youth_share_pct=s.youth_share_pct,
            demographic_trend=s.demographic_trend,
            reported_problems_count=s.reported_problems_count,
            active_innovations_count=s.active_innovations_count,
            key_social_challenge=s.key_social_challenge
        )
        for s in stats
    ]

def get_educational_materials() -> List[EducationalMaterial]:
    return SAMPLE_MATERIALS
