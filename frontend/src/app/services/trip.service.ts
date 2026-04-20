import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';

export interface Trip {
  trip_id: number;
  user_id: number;
  trip_name: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface BucketItemOut {
  item_id: number;
  trip_id: number;
  title: string;
  category: string | null;
  priority: string;
  location_name: string | null;
  notes: string | null;
  status: string;
}

export interface CalendarEventOut {
  event_id: number;
  trip_id: number;
  bucket_item_id: number | null;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private base = 'http://localhost:8000/api';
  private _tripId: number | null = null;


  private _itemsCache: BucketItemOut[] | null = null;
  private _eventsCache: CalendarEventOut[] | null = null;

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('current_trip_id');
    if (stored) this._tripId = Number(stored);
  }

  getOrCreateTrip(): Observable<number> {
    if (this._tripId !== null) return of(this._tripId);
    return this.http.get<Trip[]>(`${this.base}/trips`).pipe(
      switchMap(trips => {
        if (trips.length > 0) { this._set(trips[0].trip_id); return of(trips[0].trip_id); }
        return this.http.post<Trip>(`${this.base}/trips`, { trip_name: 'My Trip' }).pipe(
          tap(t => this._set(t.trip_id)),
          switchMap(t => of(t.trip_id))
        );
      })
    );
  }

  private _set(id: number) { this._tripId = id; localStorage.setItem('current_trip_id', String(id)); }
  clearTrip() { this._tripId = null; this._itemsCache = null; this._eventsCache = null; localStorage.removeItem('current_trip_id'); }

 

  listItems(tripId: number, forceRefresh = false): Observable<BucketItemOut[]> {
    if (!forceRefresh && this._itemsCache !== null) return of(this._itemsCache);
    return this.http.get<BucketItemOut[]>(`${this.base}/trips/${tripId}/items`).pipe(
      tap(items => { this._itemsCache = items; })
    );
  }

  createItem(tripId: number, body: any): Observable<BucketItemOut> {
    return this.http.post<BucketItemOut>(`${this.base}/trips/${tripId}/items`, body).pipe(
      tap(item => { if (this._itemsCache) this._itemsCache.push(item); })
    );
  }

  updateItem(tripId: number, itemId: number, body: any): Observable<BucketItemOut> {
    return this.http.patch<BucketItemOut>(`${this.base}/trips/${tripId}/items/${itemId}`, body).pipe(
      tap(updated => {
        if (this._itemsCache) {
          const idx = this._itemsCache.findIndex(i => i.item_id === itemId);
          if (idx !== -1) this._itemsCache[idx] = updated;
        }
      })
    );
  }

  deleteItem(tripId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/trips/${tripId}/items/${itemId}`).pipe(
      tap(() => { if (this._itemsCache) this._itemsCache = this._itemsCache.filter(i => i.item_id !== itemId); })
    );
  }



  listEvents(tripId: number, forceRefresh = false): Observable<CalendarEventOut[]> {
    if (!forceRefresh && this._eventsCache !== null) return of(this._eventsCache);
    return this.http.get<CalendarEventOut[]>(`${this.base}/trips/${tripId}/events`).pipe(
      tap(events => { this._eventsCache = events; })
    );
  }

  createEvent(tripId: number, body: any): Observable<CalendarEventOut> {
    return this.http.post<CalendarEventOut>(`${this.base}/trips/${tripId}/events`, body).pipe(
      tap(ev => { if (this._eventsCache) this._eventsCache.push(ev); })
    );
  }

  deleteEvent(tripId: number, eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/trips/${tripId}/events/${eventId}`).pipe(
      tap(() => { if (this._eventsCache) this._eventsCache = this._eventsCache.filter(e => e.event_id !== eventId); })
    );
  }

  exportIcsUrl(tripId: number): string {
    return `${this.base}/trips/${tripId}/export/ics`;
  }

  
  getTripDetails(tripId: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.base}/trips/${tripId}`);
  }

  createInvite(tripId: number, email: string, permission: string = 'viewer'): Observable<any> {
    return this.http.post(`${this.base}/trips/${tripId}/invites`, { invite_email: email, permission_level: permission });
  }

  listInvites(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/trips/${tripId}/invites`);
  }
}