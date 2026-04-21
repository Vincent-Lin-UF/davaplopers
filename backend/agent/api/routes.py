import asyncio
import secrets
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from agent.api.deps import get_current_user
from agent.core.schemas import (
    ChatRequest, ChatResponse,
    TripCreate, TripUpdate, TripOut,
    BucketItemCreate, BucketItemUpdate, BucketItemOut,
    CalendarEventCreate, CalendarEventUpdate, CalendarEventOut,
    InviteCreate, InviteOut, InviteTokenView, InviteRespond,
)
from agent.core.llm import OpenAIProvider
from agent.core.config import OPENAI_API_KEY, OPENAI_MODEL
from agent.orchestrator import Orchestrator
from agent.tools.search_places import SearchPlacesTool
import agent.services.trips as trip_svc
import agent.services.bucket_items as item_svc
import agent.services.calendar_events as event_svc
from agent.services.email import send_invite_email
from db.connection import execute, execute_one, execute_write

router = APIRouter()


# ── Chat ──────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user: dict = Depends(get_current_user)):
    llm = OpenAIProvider(api_key=OPENAI_API_KEY, model=OPENAI_MODEL)
    orchestrator = Orchestrator(llm=llm, tools={"search_places": SearchPlacesTool()})
    return await orchestrator.handle(request)


# ── Trips ─────────────────────────────────────────────────────────────────────

@router.get("/trips", response_model=list[TripOut])
async def list_trips(user: dict = Depends(get_current_user)):
    return await trip_svc.list_trips(user["user_id"])


@router.post("/trips", response_model=TripOut, status_code=201)
async def create_trip(body: TripCreate, user: dict = Depends(get_current_user)):
    return await trip_svc.create_trip(user["user_id"], body.trip_name, body.destination, body.start_date, body.end_date)


@router.get("/trips/{trip_id}", response_model=TripOut)
async def get_trip(trip_id: int, user: dict = Depends(get_current_user)):
    trip = await trip_svc.get_trip(trip_id, user["user_id"])
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.patch("/trips/{trip_id}", response_model=TripOut)
async def update_trip(trip_id: int, body: TripUpdate, user: dict = Depends(get_current_user)):
    trip = await trip_svc.update_trip(trip_id, user["user_id"], body.trip_name, body.destination, body.start_date, body.end_date)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.delete("/trips/{trip_id}", status_code=204)
async def delete_trip(trip_id: int, user: dict = Depends(get_current_user)):
    if not await trip_svc.delete_trip(trip_id, user["user_id"]):
        raise HTTPException(status_code=404, detail="Trip not found")


# ── Bucket Items ──────────────────────────────────────────────────────────────

async def _require_trip(trip_id: int, user_id: int):
    trip = await trip_svc.get_trip(trip_id, user_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


async def _require_editor(trip_id: int, user: dict):
    """Caller must be trip owner or an accepted invitee with editor permission."""
    trip = await trip_svc.get_trip(trip_id, user["user_id"])
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip["user_id"] == user["user_id"]:
        return trip
    invite = await execute_one(
        "SELECT permission_level FROM shared_invites "
        "WHERE trip_id=%s AND accepted_user_id=%s AND invite_status='accepted'",
        (trip_id, user["user_id"]),
    )
    if not invite or invite["permission_level"] != "editor":
        raise HTTPException(status_code=403, detail="You don't have edit permission for this trip")
    return trip


@router.get("/trips/{trip_id}/items", response_model=list[BucketItemOut])
async def list_items(trip_id: int, user: dict = Depends(get_current_user)):
    await _require_trip(trip_id, user["user_id"])
    return await item_svc.list_items(trip_id)


@router.post("/trips/{trip_id}/items", response_model=BucketItemOut, status_code=201)
async def create_item(trip_id: int, body: BucketItemCreate, user: dict = Depends(get_current_user)):
    await _require_editor(trip_id, user)
    return await item_svc.create_item(trip_id, body.title, body.category, body.priority, body.location_name, body.notes, body.image)


@router.patch("/trips/{trip_id}/items/{item_id}", response_model=BucketItemOut)
async def update_item(trip_id: int, item_id: int, body: BucketItemUpdate, user: dict = Depends(get_current_user)):
    await _require_editor(trip_id, user)
    item = await item_svc.update_item(item_id, trip_id, body.title, body.category, body.priority, body.location_name, body.notes, body.status, body.image)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/trips/{trip_id}/items/{item_id}", status_code=204)
async def delete_item(trip_id: int, item_id: int, user: dict = Depends(get_current_user)):
    await _require_editor(trip_id, user)
    if not await item_svc.delete_item(item_id, trip_id):
        raise HTTPException(status_code=404, detail="Item not found")


# ── Calendar Events ───────────────────────────────────────────────────────────

@router.get("/trips/{trip_id}/events", response_model=list[CalendarEventOut])
async def list_events(trip_id: int, user: dict = Depends(get_current_user)):
    await _require_trip(trip_id, user["user_id"])
    return await event_svc.list_events(trip_id)


@router.post("/trips/{trip_id}/events", response_model=CalendarEventOut, status_code=201)
async def create_event(trip_id: int, body: CalendarEventCreate, user: dict = Depends(get_current_user)):
    await _require_editor(trip_id, user)
    return await event_svc.create_event(trip_id, body.title, str(body.event_date), body.bucket_item_id, body.start_time, body.end_time, body.location_name, body.image)


@router.patch("/trips/{trip_id}/events/{event_id}", response_model=CalendarEventOut)
async def update_event(trip_id: int, event_id: int, body: CalendarEventUpdate, user: dict = Depends(get_current_user)):
    await _require_editor(trip_id, user)
    ev = await event_svc.update_event(event_id, trip_id, body.title, str(body.event_date) if body.event_date else None, body.start_time, body.end_time, body.location_name, body.image)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


@router.delete("/trips/{trip_id}/events/{event_id}", status_code=204)
async def delete_event(trip_id: int, event_id: int, user: dict = Depends(get_current_user)):
    await _require_editor(trip_id, user)
    if not await event_svc.delete_event(event_id, trip_id):
        raise HTTPException(status_code=404, detail="Event not found")


@router.get("/trips/{trip_id}/export/ics")
async def export_ics(trip_id: int, user: dict = Depends(get_current_user)):
    trip = await _require_trip(trip_id, user["user_id"])
    events = await event_svc.list_events(trip_id)
    name = trip.get("trip_name") or trip.get("destination") or "PlanCation Trip"
    return Response(
        content=event_svc.build_ics(events, name),
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{name.replace(" ","_")}.ics"'},
    )


# ── Invites ───────────────────────────────────────────────────────────────────

@router.get("/trips/{trip_id}/invites", response_model=list[InviteOut])
async def list_invites(trip_id: int, user: dict = Depends(get_current_user)):
    await _require_trip(trip_id, user["user_id"])
    rows = await execute("SELECT * FROM shared_invites WHERE trip_id=%s ORDER BY created_at DESC", (trip_id,))
    seen: set[str] = set()
    unique = []
    for r in rows:
        d = dict(r)
        if d["invite_email"] not in seen:
            seen.add(d["invite_email"])
            unique.append(d)
    return unique


@router.post("/trips/{trip_id}/invites", response_model=InviteOut, status_code=201)
async def create_invite(trip_id: int, body: InviteCreate, user: dict = Depends(get_current_user)):
    trip = await _require_trip(trip_id, user["user_id"])
    existing = await execute_one(
        "SELECT * FROM shared_invites WHERE trip_id=%s AND invite_email=%s",
        (trip_id, body.invite_email),
    )
    if existing:
        row = dict(existing)
        if not row.get("invite_token"):
            token = secrets.token_urlsafe(32)
            await execute_write(
                "UPDATE shared_invites SET invite_token = %s WHERE invite_id = %s",
                (token, row["invite_id"]),
            )
            row["invite_token"] = token
    else:
        token = secrets.token_urlsafe(32)
        inv_id = await execute_write(
            "INSERT INTO shared_invites (trip_id, invite_email, permission_level, invite_token) VALUES (%s,%s,%s,%s)",
            (trip_id, body.invite_email, body.permission_level, token),
        )
        row = dict(await execute_one("SELECT * FROM shared_invites WHERE invite_id=%s", (inv_id,)))
    trip_name = trip.get("trip_name") or trip.get("destination") or "our trip"
    ok = await send_invite_email(body.invite_email, user["email"], trip_name, row["invite_token"])
    print(f"[create_invite] send_invite_email returned {ok}")
    return row


@router.delete("/trips/{trip_id}/invites/{invite_id}", status_code=204)
async def delete_invite(trip_id: int, invite_id: int, user: dict = Depends(get_current_user)):
    await _require_trip(trip_id, user["user_id"])
    await execute_write("DELETE FROM shared_invites WHERE invite_id=%s AND trip_id=%s", (invite_id, trip_id))


# ── Invite-by-token (for invitees clicking the email link) ────────────────────

@router.get("/invites/by-token/{token}", response_model=InviteTokenView)
async def get_invite_by_token(token: str):
    row = await execute_one(
        """
        SELECT si.invite_email, si.permission_level, si.invite_status,
               t.trip_name, u.email AS inviter_email
        FROM shared_invites si
        JOIN trips t ON t.trip_id = si.trip_id
        JOIN users u ON u.user_id = t.user_id
        WHERE si.invite_token = %s
        """,
        (token,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Invite not found")
    return dict(row)


@router.post("/invites/by-token/{token}/respond")
async def respond_to_invite(token: str, body: InviteRespond, user: dict = Depends(get_current_user)):
    if body.status not in ("accepted", "declined"):
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'declined'")

    invite = await execute_one(
        "SELECT invite_id, invite_email, invite_status FROM shared_invites WHERE invite_token = %s",
        (token,),
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite["invite_email"].lower() != user["email"].lower():
        raise HTTPException(status_code=403, detail="This invite is for a different email address")

    if invite["invite_status"] != "pending":
        raise HTTPException(status_code=409, detail=f"Invite already {invite['invite_status']}")

    accepted_user_id = user["user_id"] if body.status == "accepted" else None
    await execute_write(
        "UPDATE shared_invites SET invite_status = %s, accepted_user_id = %s WHERE invite_id = %s",
        (body.status, accepted_user_id, invite["invite_id"]),
    )
    return {"status": body.status}