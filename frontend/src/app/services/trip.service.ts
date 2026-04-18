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
  clearTrip() { this._tripId = null; localStorage.removeItem('current_trip_id'); }

  listItems(tripId: number): Observable<BucketItemOut[]> {
    return this.http.get<BucketItemOut[]>(`${this.base}/trips/${tripId}/items`);
  }
  createItem(tripId: number, body: any): Observable<BucketItemOut> {
    return this.http.post<BucketItemOut>(`${this.base}/trips/${tripId}/items`, body);
  }
  updateItem(tripId: number, itemId: number, body: any): Observable<BucketItemOut> {
    return this.http.patch<BucketItemOut>(`${this.base}/trips/${tripId}/items/${itemId}`, body);
  }
  deleteItem(tripId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/trips/${tripId}/items/${itemId}`);
  }

  listEvents(tripId: number): Observable<CalendarEventOut[]> {
    return this.http.get<CalendarEventOut[]>(`${this.base}/trips/${tripId}/events`);
  }
  createEvent(tripId: number, body: any): Observable<CalendarEventOut> {
    return this.http.post<CalendarEventOut>(`${this.base}/trips/${tripId}/events`, body);
  }
  deleteEvent(tripId: number, eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/trips/${tripId}/events/${eventId}`);
  }
  exportIcsUrl(tripId: number): string {
    return `${this.base}/trips/${tripId}/export/ics`;
  }
}