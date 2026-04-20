from datetime import datetime
from typing import Optional
from db.connection import execute, execute_one, execute_write


def _time_str(val) -> str | None:
    """Convert MySQL timedelta or string to HH:MM string."""
    if val is None:
        return None
    if hasattr(val, 'seconds'):  # timedelta from MySQL
        total = int(val.total_seconds())
        h, m = divmod(total // 60, 60)
        return f"{h:02d}:{m:02d}"
    return str(val)[:5]  # already a string, trim to HH:MM


async def _row(event_id: int, trip_id: int) -> Optional[dict]:
    row = await execute_one(
        "SELECT event_id, trip_id, bucket_item_id, title, event_date, start_time, end_time, location_name FROM calendar_events WHERE event_id=%s AND trip_id=%s",
        (event_id, trip_id),
    )
    if not row:
        return None
    r = dict(row)
    r['start_time'] = _time_str(r.get('start_time'))
    r['end_time'] = _time_str(r.get('end_time'))
    return r


async def list_events(trip_id: int) -> list[dict]:
    rows = await execute(
        "SELECT event_id, trip_id, bucket_item_id, title, event_date, start_time, end_time, location_name FROM calendar_events WHERE trip_id=%s ORDER BY event_date ASC, start_time ASC",
        (trip_id,),
    )
    result = []
    for row in rows:
        r = dict(row)
        r['start_time'] = _time_str(r.get('start_time'))
        r['end_time'] = _time_str(r.get('end_time'))
        result.append(r)
    return result


async def create_event(trip_id: int, title: str, event_date: str, bucket_item_id=None, start_time=None, end_time=None, location_name=None) -> dict:
    event_id = await execute_write(
        "INSERT INTO calendar_events (trip_id, bucket_item_id, title, event_date, start_time, end_time, location_name) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (trip_id, bucket_item_id, title, event_date, start_time, end_time, location_name),
    )
    return await _row(event_id, trip_id)


async def update_event(event_id: int, trip_id: int, title=None, event_date=None, start_time=None, end_time=None, location_name=None) -> Optional[dict]:
    if not await _row(event_id, trip_id):
        return None
    await execute_write(
        "UPDATE calendar_events SET title=COALESCE(%s,title), event_date=COALESCE(%s,event_date), start_time=COALESCE(%s,start_time), end_time=COALESCE(%s,end_time), location_name=COALESCE(%s,location_name) WHERE event_id=%s AND trip_id=%s",
        (title, event_date, start_time, end_time, location_name, event_id, trip_id),
    )
    return await _row(event_id, trip_id)


async def delete_event(event_id: int, trip_id: int) -> bool:
    if not await _row(event_id, trip_id):
        return False
    await execute_write("DELETE FROM calendar_events WHERE event_id=%s AND trip_id=%s", (event_id, trip_id))
    return True


def build_ics(events: list[dict], trip_name: str = "PlanCation Trip") -> str:
    def dt(date_val, time_val=None):
        s = str(date_val)
        if time_val:
            try:
                return datetime.strptime(f"{s} {str(time_val)[:5]}", "%Y-%m-%d %H:%M").strftime("%Y%m%dT%H%M%S")
            except ValueError:
                pass
        return s.replace("-", "")

    lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//PlanCation//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH",f"X-WR-CALNAME:{trip_name}"]
    for ev in events:
        ds = dt(ev["event_date"], ev.get("start_time"))
        de = dt(ev["event_date"], ev.get("end_time")) or ds
        sl = f"DTSTART;VALUE=DATE:{ds}" if "T" not in ds else f"DTSTART:{ds}"
        el = f"DTEND;VALUE=DATE:{de}" if "T" not in de else f"DTEND:{de}"
        lines += ["BEGIN:VEVENT", f"UID:event-{ev['event_id']}@plancation", f"SUMMARY:{ev['title']}", sl, el]
        if ev.get("location_name"):
            lines.append(f"LOCATION:{ev['location_name']}")
        lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"