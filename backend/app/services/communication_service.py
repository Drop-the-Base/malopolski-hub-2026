import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.communication import CommunicationThread, ThreadMessage, Mentor
from app.schemas.communication_schema import ThreadCreate, ThreadDetail, MessageItem, MentorProfile

async def get_threads(db: AsyncSession, category: Optional[str] = None) -> List[ThreadDetail]:
    query = select(CommunicationThread).options(selectinload(CommunicationThread.messages)).order_by(CommunicationThread.created_at.desc())
    if category:
        query = query.where(CommunicationThread.category == category)
    result = await db.execute(query)
    threads = result.scalars().all()

    output = []
    for t in threads:
        messages = [
            MessageItem(
                id=m.id,
                sender_name=m.sender_name,
                sender_role=m.sender_role,
                content=m.content,
                created_at=m.created_at
            )
            for m in t.messages
        ]
        output.append(
            ThreadDetail(
                id=t.id,
                title=t.title,
                category=t.category,
                author_name=t.author_name,
                author_role=t.author_role,
                powiat=t.powiat,
                status=t.status,
                created_at=t.created_at,
                messages=messages
            )
        )
    return output

async def create_thread(db: AsyncSession, req: ThreadCreate) -> ThreadDetail:
    thread_id = f"thread-{uuid.uuid4().hex[:8]}"
    thread = CommunicationThread(
        id=thread_id,
        title=req.title,
        category=req.category,
        author_name=req.author_name,
        author_role=req.author_role,
        powiat=req.powiat,
        status="open"
    )
    db.add(thread)
    await db.flush()

    msg = ThreadMessage(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        thread_id=thread_id,
        sender_name=req.author_name,
        sender_role=req.author_role,
        content=req.initial_message
    )
    db.add(msg)
    await db.commit()

    return await get_thread_by_id(db, thread_id)

async def get_thread_by_id(db: AsyncSession, thread_id: str) -> Optional[ThreadDetail]:
    query = select(CommunicationThread).options(selectinload(CommunicationThread.messages)).where(CommunicationThread.id == thread_id)
    result = await db.execute(query)
    t = result.scalar_one_or_none()
    if not t:
        return None
    messages = [
        MessageItem(
            id=m.id,
            sender_name=m.sender_name,
            sender_role=m.sender_role,
            content=m.content,
            created_at=m.created_at
        )
        for m in t.messages
    ]
    return ThreadDetail(
        id=t.id,
        title=t.title,
        category=t.category,
        author_name=t.author_name,
        author_role=t.author_role,
        powiat=t.powiat,
        status=t.status,
        created_at=t.created_at,
        messages=messages
    )

async def add_message(db: AsyncSession, thread_id: str, sender_name: str, sender_role: str, content: str) -> MessageItem:
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    msg = ThreadMessage(
        id=msg_id,
        thread_id=thread_id,
        sender_name=sender_name,
        sender_role=sender_role,
        content=content
    )
    db.add(msg)
    await db.commit()
    return MessageItem(
        id=msg.id,
        sender_name=msg.sender_name,
        sender_role=msg.sender_role,
        content=msg.content,
        created_at=msg.created_at
    )

async def get_mentors(db: AsyncSession) -> List[MentorProfile]:
    result = await db.execute(select(Mentor))
    mentors = result.scalars().all()
    return [
        MentorProfile(
            id=m.id,
            full_name=m.full_name,
            specialization=m.specialization,
            bio=m.bio,
            available_hours=m.available_hours,
            contact_email=m.contact_email,
            avatar_url=m.avatar_url
        )
        for m in mentors
    ]
