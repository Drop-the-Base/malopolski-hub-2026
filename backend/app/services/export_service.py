"""Eksporty CSV (Panel ROPS, otwarte dane) i agregacja potrzeb per powiat i obszar – bez danych osobowych."""
import csv
import io
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional, Sequence
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import category_label
from app.models.problem_report import ProblemReport

# Znaki, od których arkusz kalkulacyjny zaczyna formułę – neutralizujemy je (ochrona przed CSV injection)
_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _cell(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "tak" if value else "nie"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M")
    if isinstance(value, (list, tuple)):
        value = ", ".join(str(v) for v in value)
    text = str(value).replace("\r\n", " ").replace("\n", " ")
    return f"'{text}" if text.startswith(_FORMULA_PREFIXES) else text


def to_csv(header: Sequence[str], rows: Iterable[Sequence[Any]]) -> str:
    """CSV ze średnikiem (domyślny separator polskiego Excela) i BOM UTF-8, żeby polskie znaki otwierały się poprawnie."""
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";", quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
    writer.writerow(header)
    for row in rows:
        writer.writerow([_cell(v) for v in row])
    return "﻿" + buf.getvalue()


def csv_response(content: str, filename_stem: str, public: bool = False) -> Response:
    filename = f"{filename_stem}-{datetime.utcnow().strftime('%Y-%m-%d')}.csv"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    if not public:
        headers["Cache-Control"] = "no-store"
    return Response(content=content, media_type="text/csv; charset=utf-8", headers=headers)


async def aggregate_needs(db: AsyncSession) -> List[Dict[str, Any]]:
    """
    Zagregowane potrzeby: liczba zgłoszeń per powiat i obszar (Rejestr Wyzwań + anonimowe zapytania Matchmakingu).
    Zwraca wyłącznie liczby – bez treści zgłoszeń i danych zgłaszających.
    """
    reports = (await db.execute(select(ProblemReport))).scalars().all()
    recent_from = datetime.utcnow() - timedelta(days=90)
    groups: Dict[tuple, Dict[str, Any]] = {}
    for r in reports:
        key = (r.powiat or "", r.category or "")
        g = groups.setdefault(key, {
            "powiat": r.powiat, "category": r.category, "category_label": category_label(r.category),
            "reports_total": 0, "registry_reports": 0, "matchmaking_queries": 0, "critical_reports": 0,
            "affected_residents": 0, "reports_last_90_days": 0, "last_reported_at": None,
        })
        g["reports_total"] += 1
        if r.status == "matched":
            g["matchmaking_queries"] += 1
        else:
            g["registry_reports"] += 1
        if r.urgency == "krytyczny":
            g["critical_reports"] += 1
        g["affected_residents"] += r.affected_count or 0
        if r.created_at and r.created_at >= recent_from:
            g["reports_last_90_days"] += 1
        if r.created_at and (g["last_reported_at"] is None or r.created_at > g["last_reported_at"]):
            g["last_reported_at"] = r.created_at
    return sorted(groups.values(), key=lambda g: (-g["reports_total"], g["powiat"] or "", g["category"] or ""))


NEEDS_HEADER = [
    "powiat", "obszar", "obszar_nazwa", "zgloszenia_razem", "z_rejestru_wyzwan", "z_matchmakingu",
    "krytyczne", "osoby_dotkniete", "ostatnie_90_dni", "ostatnie_zgloszenie",
]


def needs_rows(groups: List[Dict[str, Any]]) -> List[List[Any]]:
    return [[
        g["powiat"], g["category"], g["category_label"], g["reports_total"], g["registry_reports"],
        g["matchmaking_queries"], g["critical_reports"], g["affected_residents"], g["reports_last_90_days"],
        g["last_reported_at"],
    ] for g in groups]


def paginate(items: List[Any], page: int, page_size: int, base_path: str, extra_query: Optional[str] = None) -> Dict[str, Any]:
    """Koperta stronicowania dla otwartego API: items + total/page/pages + linki next/previous."""
    total = len(items)
    pages = max(1, -(-total // page_size))
    start = (page - 1) * page_size
    suffix = f"&{extra_query}" if extra_query else ""

    def link(p: int) -> str:
        return f"{base_path}?page={p}&page_size={page_size}{suffix}"

    return {
        "items": items[start:start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "next": link(page + 1) if page < pages else None,
        "previous": link(page - 1) if page > 1 and start < total else None,
    }
