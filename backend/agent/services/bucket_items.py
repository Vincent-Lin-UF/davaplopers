from typing import Optional
from db.connection import execute, execute_one, execute_write


async def _row(item_id: int, trip_id: int) -> Optional[dict]:
    row = await execute_one(
        "SELECT item_id, trip_id, title, category, priority, location_name, notes, status FROM bucket_list_items WHERE item_id=%s AND trip_id=%s",
        (item_id, trip_id),
    )
    return dict(row) if row else None


async def list_items(trip_id: int) -> list[dict]:
    rows = await execute(
        """SELECT item_id, trip_id, title, category, priority, location_name, notes, status
           FROM bucket_list_items WHERE trip_id=%s
           ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END, created_at DESC""",
        (trip_id,),
    )
    return [dict(r) for r in rows]


async def create_item(trip_id: int, title: str, category=None, priority="medium", location_name=None, notes=None) -> dict:
    item_id = await execute_write(
        "INSERT INTO bucket_list_items (trip_id, title, category, priority, location_name, notes) VALUES (%s,%s,%s,%s,%s,%s)",
        (trip_id, title, category, priority, location_name, notes),
    )
    return await _row(item_id, trip_id)


async def update_item(item_id: int, trip_id: int, title=None, category=None, priority=None, location_name=None, notes=None, status=None) -> Optional[dict]:
    if not await _row(item_id, trip_id):
        return None
    await execute_write(
        "UPDATE bucket_list_items SET title=COALESCE(%s,title), category=COALESCE(%s,category), priority=COALESCE(%s,priority), location_name=COALESCE(%s,location_name), notes=COALESCE(%s,notes), status=COALESCE(%s,status) WHERE item_id=%s AND trip_id=%s",
        (title, category, priority, location_name, notes, status, item_id, trip_id),
    )
    return await _row(item_id, trip_id)


async def delete_item(item_id: int, trip_id: int) -> bool:
    if not await _row(item_id, trip_id):
        return False
    await execute_write("DELETE FROM bucket_list_items WHERE item_id=%s AND trip_id=%s", (item_id, trip_id))
    return True