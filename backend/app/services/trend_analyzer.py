from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.constants import category_label, CATEGORY_LABELS
from app.models.innovation import Innovation
from app.models.notification import Notification
from app.models.problem_report import ProblemReport
from app.models.regional_stat import RegionalStat
from app.models.idea_fiszka import IdeaFiszka
from app.schemas.admin_trends_schema import TrendRadarSummary, PoviatTrendMetric


def _growth(recent: int, previous: int) -> Optional[float]:
    if previous == 0:
        return None
    return round((recent - previous) / previous * 100, 1)


def _short_challenge(text: str) -> str:
    """Pierwsze zdanie wyzwania z mapy, skrócone do czytelnej etykiety (zamiast pierwszego słowa)."""
    first = text.split(".")[0].strip()
    return first if len(first) <= 70 else first[:67].rstrip() + "…"


async def analyze_social_trends(db: AsyncSession) -> TrendRadarSummary:
    now = datetime.utcnow()
    q90 = now - timedelta(days=90)
    q180 = now - timedelta(days=180)

    reports = (await db.execute(select(ProblemReport))).scalars().all()
    powiaty = (await db.execute(select(RegionalStat).order_by(RegionalStat.powiat_name))).scalars().all()
    innovations = (await db.execute(select(Innovation).where(Innovation.is_published == True))).scalars().all()

    by_powiat: Dict[str, List[ProblemReport]] = defaultdict(list)
    for r in reports:
        if r.powiat:
            by_powiat[r.powiat].append(r)

    breakdown: List[PoviatTrendMetric] = []
    for p in powiaty:
        own = by_powiat.get(p.powiat_name, [])
        cats = Counter(r.category for r in own if r.category in CATEGORY_LABELS)
        top = category_label(cats.most_common(1)[0][0]) if cats else _short_challenge(p.key_social_challenge or "Brak danych")
        recent = sum(1 for r in own if r.created_at and r.created_at >= q90)
        previous = sum(1 for r in own if r.created_at and q180 <= r.created_at < q90)
        growth = _growth(recent, previous)
        critical = sum(1 for r in own if r.urgency == "krytyczny")

        if p.senior_share_pct > 26.0 or critical >= 2:
            alert, reason = "high_critical", (
                f"Odsetek seniorów {p.senior_share_pct:.1f}%" if p.senior_share_pct > 26.0 else f"{critical} zgłoszenia krytyczne"
            )
        elif p.reported_problems_count + len(own) > 40 or (growth is not None and growth >= 25):
            alert, reason = "medium", "Wysoka liczba zgłoszeń" if growth is None else f"Wzrost zgłoszeń o {growth}%"
        else:
            alert, reason = "low", "Brak sygnałów alarmowych"

        breakdown.append(PoviatTrendMetric(
            powiat=p.powiat_name,
            top_problem_category=top,
            reported_cases_count=p.reported_problems_count + len(own),
            platform_cases_count=len(own),
            quarterly_growth_pct=growth,
            alert_level=alert,
            alert_reason=reason,
        ))

    # Najostrzejsze wyzwania: kategorie z największą liczbą zgłoszeń na platformie
    cat_counts = Counter(r.category for r in reports if r.category in CATEGORY_LABELS)
    acute: List[Dict[str, Any]] = []
    total_cat = sum(cat_counts.values()) or 1
    for cat, count in cat_counts.most_common(3):
        hotspots = Counter(r.powiat for r in reports if r.category == cat and r.powiat).most_common(4)
        inn = next((i for i in innovations if i.category == cat), None)
        acute.append({
            "category": category_label(cat),
            "impact_score": round(100 * count / total_cat),
            "cases_count": count,
            "hotspot_powiaty": [h for h, _ in hotspots] or ["brak danych o lokalizacji"],
            "suggested_action": (
                f"Promować wdrożenia innowacji „{inn.title}” w powiatach o najwyższej liczbie zgłoszeń."
                if inn else "Brak innowacji w katalogu – rozważyć nabór pomysłów w tym obszarze."
            ),
        })

    # Białe plamy: kategorie, w których zgłoszenia są, a innowacji w katalogu brak lub jest jedna
    inn_per_cat = Counter(i.category for i in innovations)
    gaps = [
        f"{category_label(cat)}: {cnt} zgłoszeń, tylko {inn_per_cat.get(cat, 0)} innowacja(e) w katalogu."
        for cat, cnt in cat_counts.most_common() if inn_per_cat.get(cat, 0) <= 1 and cnt >= 2
    ]
    silent = [p.powiat_name for p in powiaty if not by_powiat.get(p.powiat_name)]
    if silent:
        gaps.append(f"Brak zgłoszeń z platformy z {len(silent)} powiatów (m.in. {', '.join(silent[:4])}) – potrzebna promocja Hubu.")
    unmatched = sum(1 for r in reports if r.status == "matched" and not r.matched_innovations)
    if unmatched:
        gaps.append(f"{unmatched} zapytań mieszkańców nie znalazło pasującej innowacji – kandydaci do naboru pomysłów.")

    recent_all = sum(1 for r in reports if r.created_at and r.created_at >= q90)
    prev_all = sum(1 for r in reports if r.created_at and q180 <= r.created_at < q90)
    last30 = sum(1 for r in reports if r.created_at and r.created_at >= now - timedelta(days=30))
    baseline = sum(p.reported_problems_count for p in powiaty)

    pending = (await db.execute(
        select(func.count(IdeaFiszka.id)).where(IdeaFiszka.status.in_(["submitted", "in_review"]))
    )).scalar() or 0
    unread = (await db.execute(
        select(func.count(Notification.id)).where(Notification.channel == "panel", Notification.is_read == False)
    )).scalar() or 0

    return TrendRadarSummary(
        total_problems_analyzed=baseline + len(reports),
        baseline_cases_count=baseline,
        platform_cases_count=len(reports),
        platform_cases_last_30_days=last30,
        quarterly_growth_pct=_growth(recent_all, prev_all),
        pending_ideas_count=pending,
        unread_notifications_count=unread,
        most_acute_challenges=acute,
        poviat_breakdown=breakdown,
        systemic_gaps=gaps or ["Za mało danych, by wskazać białe plamy."],
        methodology_note=(
            "Dane bazowe: zgłoszenia historyczne z diagnozy powiatów (import). Dane platformy: zapytania Matchmakingu "
            "i Rejestru Wyzwań. Wzrost kwartalny = ostatnie 90 dni vs poprzednie 90 dni (brak wartości = brak danych porównawczych)."
        ),
    )


async def get_pending_submissions(db: AsyncSession):
    result = await db.execute(select(IdeaFiszka).order_by(IdeaFiszka.created_at.desc()))
    return result.scalars().all()
