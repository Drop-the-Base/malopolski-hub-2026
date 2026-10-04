"""Nabory grantowe przechowywane w bazie (edycja w Panelu ROPS). Startowe nabory demo pochodzą z ai_assistant."""
from datetime import date
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.grant_call import GrantCallRecord
from app.schemas.idea_schema import GrantCall


def to_grant_call(record: GrantCallRecord, today: Optional[date] = None) -> GrantCall:
    today = today or date.today()
    is_open = date.fromisoformat(record.opens_on) <= today <= date.fromisoformat(record.closes_on)
    return GrantCall(
        id=record.id,
        title=record.title,
        opens_on=record.opens_on,
        closes_on=record.closes_on,
        min_budget_pln=record.min_budget_pln,
        max_budget_pln=record.max_budget_pln,
        criteria=list(record.criteria or []),
        is_open=is_open,
        category=record.category,
        powiat=record.powiat,
        updated_at=record.updated_at,
    )


async def ensure_default_grant_calls(db: AsyncSession) -> None:
    """Wgrywa nabory demonstracyjne, jeśli tabela jest pusta (nowa lub zmigrowana baza)."""
    from app.services.ai_assistant import DEFAULT_GRANT_CALLS

    if (await db.execute(select(func.count(GrantCallRecord.id)))).scalar():
        return
    for raw in DEFAULT_GRANT_CALLS:
        db.add(GrantCallRecord(**raw))
    await db.commit()


async def list_grant_calls(db: AsyncSession) -> List[GrantCall]:
    await ensure_default_grant_calls(db)
    rows = (await db.execute(select(GrantCallRecord).order_by(GrantCallRecord.opens_on.desc()))).scalars().all()
    return [to_grant_call(r) for r in rows]


async def get_grant_call(db: AsyncSession, call_id: str) -> Optional[GrantCall]:
    await ensure_default_grant_calls(db)
    record = await db.get(GrantCallRecord, call_id)
    return to_grant_call(record) if record else None
