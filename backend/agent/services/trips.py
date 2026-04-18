from typing import Optional
from db.connection import execute, execute_one, execute_write


async def list_trips(user_id: int) -> list[dict]:
    rows = await execute(
        "SELECT trip_id, user_id, trip_name, destination, start_date, end_date FROM trips WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,),
    )
    return [dict(r) for r in rows]


async def get_trip(trip_id: int, user_id: int) -> Optional[dict]:
    row = await execute_one(
        "SELECT trip_id, user_id, trip_name, destination, start_date, end_date FROM trips WHERE trip_id = %s AND user_id = %s",
        (trip_id, user_id),
    )
    return dict(row) if row else None


async def create_trip(user_id: int, trip_name=None, destination=None, start_date=None, end_date=None) -> dict:
    trip_id = await execute_write(
        "INSERT INTO trips (user_id, trip_name, destination, start_date, end_date) VALUES (%s, %s, %s, %s, %s)",
        (user_id, trip_name, destination, start_date, end_date),
    )
    return await get_trip(trip_id, user_id)


async def update_trip(trip_id: int, user_id: int, trip_name=None, destination=None, start_date=None, end_date=None) -> Optional[dict]:
    existing = await get_trip(trip_id, user_id)
    if not existing:
        return None
    await execute_write(
        "UPDATE trips SET trip_name=COALESCE(%s,trip_name), destination=COALESCE(%s,destination), start_date=COALESCE(%s,start_date), end_date=COALESCE(%s,end_date) WHERE trip_id=%s AND user_id=%s",
        (trip_name, destination, start_date, end_date, trip_id, user_id),
    )
    return await get_trip(trip_id, user_id)


async def delete_trip(trip_id: int, user_id: int) -> bool:
    existing = await get_trip(trip_id, user_id)
    if not existing:
        return False
    await execute_write("DELETE FROM trips WHERE trip_id=%s AND user_id=%s", (trip_id, user_id))
    return True