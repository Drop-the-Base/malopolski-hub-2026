"""
Subskrypcje powiadomień (G5) i zarządzanie naborami w Panelu ROPS.

Każdy może zapisać się (e-mail + zgoda RODO) na powiadomienia o nowych innowacjach i o nowych/zmienionych
naborach – wg kategorii i/lub powiatu. Gdy koordynator dodaje innowację albo otwiera/zmienia nabór,
pasujący subskrybenci dostają e-mail (bez SMTP – skrzynka nadawcza w Panelu ROPS). Wypisanie: link z tokenem.
"""
import re
import secrets
import uuid
from collections import Counter
from datetime import date, datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import CATEGORY_LABELS, POWIATY, category_label, powiat_locative, strip_diacritics
from app.core.database import get_db
from app.core.security import require_admin
from app.models.grant_call import GrantCallRecord
from app.models.notification import Notification
from app.models.subscription import Subscription
from app.schemas.idea_schema import GrantCall
from app.schemas.subscription_schema import (
    SUBSCRIPTION_TOPICS,
    CountItem,
    GrantCallAdminResponse,
    GrantCallUpsert,
    SubscriptionCreate,
    SubscriptionInfo,
    SubscriptionResponse,
    SubscriptionStats,
)
from app.services.grant_call_service import ensure_default_grant_calls, list_grant_calls, to_grant_call
from app.services.notification_service import notify
from app.services.subscription_service import ALERT_RELATED_TYPE, mask_email, notify_subscribers, unsubscribe_path

router = APIRouter(tags=["Subskrypcje powiadomień i nabory"])


def _info(sub: Subscription) -> SubscriptionInfo:
    return SubscriptionInfo(
        email_masked=mask_email(sub.email),
        topics=list(sub.topics or []),
        categories=list(sub.categories or []),
        powiaty=list(sub.powiaty or []),
        is_active=bool(sub.is_active),
    )


def _describe(topics: List[str], categories: List[str], powiaty: List[str]) -> str:
    what = ", ".join(SUBSCRIPTION_TOPICS[t].lower() for t in topics)
    cats = ", ".join(category_label(c) for c in categories) if categories else "wszystkie kategorie"
    where = ", ".join(powiaty) if powiaty else "cała Małopolska"
    return f"Tematy: {what}. Kategorie: {cats}. Obszar: {where}."


@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=201)
async def subscribe(req: SubscriptionCreate, db: AsyncSession = Depends(get_db)):
    """Zapis (lub zmiana ustawień dla tego samego adresu) na powiadomienia e-mail."""
    email = req.email.strip().lower()
    now = datetime.utcnow()
    sub = (await db.execute(select(Subscription).where(func.lower(Subscription.email) == email))).scalars().first()
    is_update = sub is not None
    if sub is None:
        sub = Subscription(id=f"sub-{uuid.uuid4().hex[:10]}", email=email, token=secrets.token_urlsafe(24), created_at=now)
        db.add(sub)
    sub.topics = req.topics
    sub.categories = req.categories
    sub.powiaty = req.powiaty
    sub.is_active = True
    sub.unsubscribed_at = None
    sub.rodo_consent_at = now
    sub.updated_at = now
    summary = _describe(req.topics, req.categories, req.powiaty)
    await notify(
        db, email,
        subject="Potwierdzenie zapisu na powiadomienia" if not is_update else "Zmieniono ustawienia powiadomień",
        body=(f"Będziemy wysyłać Ci krótkie wiadomości, gdy pojawi się coś nowego. {summary}\n\n"
              f"Wypisz się w każdej chwili: {unsubscribe_path(sub.token)}"),
        related_type="subscription", related_id=sub.id,
    )
    await db.commit()
    return SubscriptionResponse(
        message=("Zmieniliśmy Twoje ustawienia powiadomień." if is_update else "Zapisaliśmy Cię na powiadomienia.")
        + " Potwierdzenie z linkiem do wypisania wysłaliśmy e-mailem.",
        email_masked=mask_email(email),
        topics=req.topics,
        categories=req.categories,
        powiaty=req.powiaty,
        is_update=is_update,
    )


async def _by_token(db: AsyncSession, token: str) -> Subscription:
    sub = (await db.execute(select(Subscription).where(Subscription.token == token))).scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Link do wypisania jest nieprawidłowy albo wygasł.")
    return sub


@router.get("/subscriptions/{token}", response_model=SubscriptionInfo)
async def subscription_info(token: str, db: AsyncSession = Depends(get_db)):
    """Podgląd subskrypcji z linku w e-mailu (adres częściowo ukryty)."""
    return _info(await _by_token(db, token))


@router.post("/subscriptions/{token}/unsubscribe", response_model=SubscriptionInfo)
async def unsubscribe(token: str, db: AsyncSession = Depends(get_db)):
    """Wypisanie jednym kliknięciem – bez logowania."""
    sub = await _by_token(db, token)
    if sub.is_active:
        sub.is_active = False
        sub.unsubscribed_at = datetime.utcnow()
        sub.updated_at = sub.unsubscribed_at
        await db.commit()
    return _info(sub)


# --- Panel ROPS -------------------------------------------------------------------------------------------

@router.get("/admin/subscriptions/stats", response_model=SubscriptionStats, dependencies=[Depends(require_admin)])
async def subscription_stats(db: AsyncSession = Depends(get_db)):
    """Liczby aktywnych subskrybentów wg tematu, kategorii i powiatu – bez listy adresów."""
    subs = (await db.execute(select(Subscription).where(Subscription.is_active.is_(True)))).scalars().all()
    topics, cats, powiaty = Counter(), Counter(), Counter()
    all_cats = all_powiaty = 0
    for s in subs:
        topics.update(s.topics or [])
        if s.categories:
            cats.update(s.categories)
        else:
            all_cats += 1
        if s.powiaty:
            powiaty.update(s.powiaty)
        else:
            all_powiaty += 1
    alerts_sent = (await db.execute(
        select(func.count(Notification.id)).where(Notification.related_type == ALERT_RELATED_TYPE)
    )).scalar() or 0
    return SubscriptionStats(
        active_total=len(subs),
        by_topic=[CountItem(key=k, label=v, count=topics.get(k, 0)) for k, v in SUBSCRIPTION_TOPICS.items()],
        by_category=[CountItem(key=k, label=v, count=cats.get(k, 0)) for k, v in CATEGORY_LABELS.items()],
        all_categories_count=all_cats,
        by_powiat=[CountItem(key=p, label=p, count=powiaty[p]) for p in POWIATY if powiaty.get(p)],
        all_powiaty_count=all_powiaty,
        alerts_sent=alerts_sent,
    )


def _call_area(call: GrantCall) -> str:
    area = powiat_locative(call.powiat) if call.powiat else "w całej Małopolsce"
    topic = f", obszar: {category_label(call.category)}" if call.category else ""
    return f"{area}{topic}"


def _call_body(call: GrantCall) -> str:
    state = "Nabór jest otwarty – możesz już złożyć wniosek." if call.is_open else (
        "Nabór jeszcze się nie rozpoczął." if date.fromisoformat(call.opens_on) > date.today() else "Nabór jest zamknięty.")
    return (f"„{call.title}” ({_call_area(call)}).\nTermin: od {call.opens_on} do {call.closes_on}. "
            f"Kwota: {call.min_budget_pln}–{call.max_budget_pln} zł.\n{state}\n"
            f"Szkic wniosku przygotujesz w Kreatorze pomysłów: /kreator-pomyslow")


def _slug(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", strip_diacritics(title.lower())).strip("-")[:40].strip("-")
    return f"nabor-{base or 'nowy'}-{uuid.uuid4().hex[:4]}"


@router.post("/admin/grant-calls", response_model=GrantCallAdminResponse, status_code=201,
             dependencies=[Depends(require_admin)])
async def create_grant_call(req: GrantCallUpsert, db: AsyncSession = Depends(get_db)):
    """Nowy nabór. Jeśli nie jest jeszcze zamknięty, pasujący subskrybenci dostają e-mail."""
    await ensure_default_grant_calls(db)
    now = datetime.utcnow()
    record = GrantCallRecord(id=_slug(req.title), created_at=now, updated_at=now, **req.model_dump())
    db.add(record)
    call = to_grant_call(record)
    notified = 0
    if date.fromisoformat(call.closes_on) >= date.today():
        notified = await notify_subscribers(
            db, "nabory", subject=f"Nowy nabór: {call.title}", body=_call_body(call),
            category=call.category, powiat=call.powiat, related_id=call.id,
        )
    await db.commit()
    return GrantCallAdminResponse(call=call, notified_count=notified,
                                  message=f"Dodano nabór. Powiadomiono subskrybentów: {notified}.")


@router.put("/admin/grant-calls/{call_id}", response_model=GrantCallAdminResponse, dependencies=[Depends(require_admin)])
async def update_grant_call(call_id: str, req: GrantCallUpsert, db: AsyncSession = Depends(get_db)):
    """Zmiana naboru (np. przedłużenie terminu, nowe kryteria). Subskrybenci dostają opis zmian."""
    await ensure_default_grant_calls(db)
    record = await db.get(GrantCallRecord, call_id)
    if not record:
        raise HTTPException(status_code=404, detail="Nie znaleziono naboru.")
    labels = {"title": "nazwa", "opens_on": "data otwarcia", "closes_on": "data zamknięcia",
              "min_budget_pln": "kwota minimalna", "max_budget_pln": "kwota maksymalna", "criteria": "kryteria",
              "category": "obszar tematyczny", "powiat": "powiat"}
    changes = []
    for key, value in req.model_dump().items():
        old = getattr(record, key)
        if (old or None) != (value or None):
            if key == "criteria":
                changes.append("zaktualizowano kryteria")
            else:
                changes.append(f"{labels[key]}: {old if old not in (None, '') else '—'} → {value if value not in (None, '') else '—'}")
            setattr(record, key, value)
    if not changes:
        return GrantCallAdminResponse(call=to_grant_call(record), notified_count=0, message="Brak zmian do zapisania.")
    record.updated_at = datetime.utcnow()
    call = to_grant_call(record)
    notified = 0
    if date.fromisoformat(call.closes_on) >= date.today():
        notified = await notify_subscribers(
            db, "nabory", subject=f"Zmiana w naborze: {call.title}",
            body="Co się zmieniło: " + "; ".join(changes) + ".\n\n" + _call_body(call),
            category=call.category, powiat=call.powiat, related_id=call.id,
        )
    await db.commit()
    return GrantCallAdminResponse(call=call, notified_count=notified,
                                  message=f"Zapisano zmiany naboru. Powiadomiono subskrybentów: {notified}.")


@router.get("/admin/grant-calls", response_model=List[GrantCall], dependencies=[Depends(require_admin)])
async def admin_grant_calls(db: AsyncSession = Depends(get_db)):
    return await list_grant_calls(db)
