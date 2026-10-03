from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.constants import category_label, strip_diacritics
from app.models.innovation import Innovation
from app.models.regional_stat import RegionalStat
from app.schemas.innovation_schema import InnovationDetail, RegionalChallengeSummary, EducationalMaterial
from app.services.vector_store import tokenize

SAMPLE_MATERIALS = [
    EducationalMaterial(
        id="mat-001",
        title="Szablon Canwy Innowacji Społecznych (9 pól)",
        category="Metodyka",
        description="Interaktywny szablon w Kreatorze Pomysłów – wypełnij, sprawdź automatyczną checklistą i wydrukuj do PDF.",
        download_url="/kreator-pomyslow",
        format="Narzędzie online",
        is_external=False
    ),
    EducationalMaterial(
        id="mat-002",
        title="Innowacje społeczne ROPS Kraków – materiały źródłowe",
        category="Wdrożenie",
        description="Publikacje i podręczniki innowacji udostępniane przez Regionalny Ośrodek Polityki Społecznej w Krakowie.",
        download_url="https://rops.krakow.pl/",
        format="Strona zewnętrzna",
        is_external=True
    ),
    EducationalMaterial(
        id="mat-003",
        title="Tekst łatwy do czytania (ETR) – zasady",
        category="Dostępność",
        description="Europejskie standardy tworzenia informacji łatwej do czytania i zrozumienia (Inclusion Europe).",
        download_url="https://www.inclusion-europe.eu/easy-to-read/",
        format="Strona zewnętrzna",
        is_external=True
    )
]


def _to_detail(item: Innovation) -> InnovationDetail:
    return InnovationDetail(
        id=item.id,
        title=item.title,
        tagline=item.tagline,
        category=item.category,
        category_label=category_label(item.category),
        target_groups=item.target_groups or [],
        full_description=item.full_description,
        readiness_level=item.readiness_level,
        budget_bracket=item.budget_bracket or "Brak danych",
        video_url=item.video_url,
        handbook_url=item.handbook_url,
        etr_summary=item.etr_summary,
        origin_poviat=item.origin_poviat,
        is_published=item.is_published,
        created_at=item.created_at
    )


def _matches_search(item: Innovation, search: str) -> bool:
    """Wyszukiwanie bez względu na wielkość liter i polskie znaki, na rdzeniach słów (samotnosc ~ samotne)."""
    haystack = " ".join([item.title, item.tagline, item.full_description, " ".join(item.target_groups or []),
                         item.etr_summary or "", category_label(item.category)])
    query_stems = tokenize(search)
    if not query_stems:
        return strip_diacritics(search.lower()).strip() in strip_diacritics(haystack.lower())
    doc_stems = set(tokenize(haystack))
    return all(any(d.startswith(q) or (len(d) >= 4 and q.startswith(d)) for d in doc_stems) for q in query_stems)


async def get_innovations(
    db: AsyncSession,
    category: Optional[str] = None,
    target_group: Optional[str] = None,
    search: Optional[str] = None
) -> List[InnovationDetail]:
    query = select(Innovation).where(Innovation.is_published == True).order_by(Innovation.id)
    if category:
        query = query.where(Innovation.category == category)

    result = await db.execute(query)
    output = []
    for item in result.scalars().all():
        if search and search.strip() and not _matches_search(item, search):
            continue
        if target_group and target_group not in (item.target_groups or []):
            continue
        output.append(_to_detail(item))
    return output


async def get_innovation_by_id(db: AsyncSession, inn_id: str) -> Optional[InnovationDetail]:
    result = await db.execute(select(Innovation).where(Innovation.id == inn_id))
    item = result.scalar_one_or_none()
    return _to_detail(item) if item else None


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
