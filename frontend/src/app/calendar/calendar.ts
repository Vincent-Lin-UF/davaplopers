import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { BucketList, BucketItem } from '../bucket-list/bucket-list';
import { TripService, CalendarEventOut } from '../services/trip.service';
import * as L from 'leaflet';

interface CalEvent {
  event_id?: number;
  date: string;
  start_time?: string;
  end_time?: string;
  item: BucketItem;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
  id: string;
  events: CalEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, DragDropModule, BucketList],
  templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit, OnDestroy {
  @ViewChild(BucketList) bucketListComponent!: BucketList;

  today = new Date();
  current = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

  tripId: number | null = null;
  events: CalEvent[] = [];
  selectedDate: string | null = null;
  days: DayCell[] = [];

  // Event detail modal
  showEventModal = false;
  selectedEvent: CalEvent | null = null;

  // Time picker modal (shown after dropping item on a day)
  showTimePicker = false;
  pendingDrop: { item: BucketItem; cell: DayCell } | null = null;
  dropStartTime = '09:00';
  dropEndTime = '11:00';

  // Send invite modal
  showInviteModal = false;
  inviteEmail = '';
  invitePermission = 'viewer';
  inviteSaving = false;
  inviteSuccess = false;
  inviteError = '';

  // View invites modal
  showInvitesListModal = false;
  invitesList: any[] = [];
  invitesLoading = false;

  // Map
  tripDestination = '';
  private _leaflet: L.Map | null = null;

  // Toast
  toastMsg = '';
  toastTimeout: any;

  constructor(private tripSvc: TripService, private cdr: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.generateDays();
    this.tripSvc.getOrCreateTrip().subscribe({
      next: (id) => {
        this.tripId = id;
        this._load();
        this.tripSvc.listInvites(id).subscribe({
          next: (list) => { this.invitesList = list; },
          error: () => {},
        });
        this.tripSvc.getTripDetails(id).subscribe(trip => {
          if (trip.destination) {
            this.tripDestination = trip.destination;
            this._geocodeAndInitMap(trip.destination);
          } else {
            this._initMap(20, 0, 2);
          }
        });
      },
      error: () => {},
    });
  }

  ngOnDestroy() {
    if (this._leaflet) { this._leaflet.remove(); this._leaflet = null; }
  }

  private _geocodeAndInitMap(location: string) {
    const parts = location.split(',').map(p => p.trim()).filter(Boolean);
    // Build queries from most to least specific by dropping leading parts
    const queries = parts.map((_, i) => parts.slice(i).join(', '));
    this._tryGeocode(queries, 0);
  }

  private _tryGeocode(queries: string[], index: number) {
    if (index >= queries.length) { this._initMap(20, 0, 2); return; }
    this.http.get<any[]>(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queries[index])}&format=json&limit=1`
    ).subscribe({
      next: (results) => {
        if (results.length) {
          // Zoom out slightly the more specific parts we had to drop
          const zoom = Math.max(11, 16 - index * 2);
          this._initMap(+results[0].lat, +results[0].lon, zoom);
        } else {
          this._tryGeocode(queries, index + 1);
        }
      },
      error: () => this._tryGeocode(queries, index + 1),
    });
  }

  private _initMap(lat: number, lon: number, zoom: number) {
    setTimeout(() => {
      if (this._leaflet) { this._leaflet.remove(); this._leaflet = null; }
      const el = document.getElementById('trip-map');
      if (!el) return;
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      this._leaflet = L.map('trip-map').setView([lat, lon], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this._leaflet);
      if (zoom > 2) L.marker([lat, lon], { icon }).addTo(this._leaflet);
    }, 100);
  }

  private _load() {
    if (!this.tripId) return;
    this.tripSvc.listEvents(this.tripId, true).subscribe({
      next: (rows) => {
          this.events = rows.map(r => this._map(r));
          this._sortAndGenerate();
        },
      error: () => {},
    });
  }

  private _map(r: CalendarEventOut): CalEvent {
    return {
      event_id: r.event_id,
      date: r.event_date,
      start_time: r.start_time || undefined,
      end_time: r.end_time || undefined,
      item: {
        item_id: r.bucket_item_id ?? undefined,
        name: r.title,
        location: r.location_name ?? '',
        priority: 'Medium',
        activityTypes: [],
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
      },
    };
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  showToast(msg: string) {
    this.toastMsg = msg;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMsg = ''; this.cdr.detectChanges(); }, 1500);
  }

  // ── Calendar grid ─────────────────────────────────────────────────────────

  get monthLabel() {
    return this.current.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  generateDays() {
    const year = this.current.getFullYear();
    const month = this.current.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];

    for (let i = firstDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inMonth: false, id: this.fmt(d), events: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, inMonth: true, id: this.fmt(dt), events: [] });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date: d, inMonth: false, id: this.fmt(d), events: [] });
    }
    cells.forEach(cell => { cell.events = this.events.filter(e => e.date === cell.id); });
    this.days = cells;
  }

  isToday(date: Date) { return this.fmt(date) === this.fmt(this.today); }
  isSelected(date: Date) { return this.fmt(date) === this.selectedDate; }
  selectDay(cell: DayCell) { this.selectedDate = this.fmt(cell.date); }

  // ── Event detail modal ────────────────────────────────────────────────────

  openEventModal(ev: CalEvent, e: Event) {
    e.stopPropagation();
    this.selectedEvent = ev;
    this.showEventModal = true;
  }

  closeEventModal() { this.showEventModal = false; this.selectedEvent = null; }

  flyToLocation(location: string) {
    this.closeEventModal();
    this._geocodeAndInitMap(location);
  }

  deleteSelectedEvent() {
    if (!this.selectedEvent || !this.tripId) return;
    const ev = this.selectedEvent;
    if (ev.event_id) {
      this.tripSvc.deleteEvent(this.tripId, ev.event_id).subscribe({
        next: () => { this._removeEvent(ev); this.showToast('Event deleted'); },
        error: () => { this._removeEvent(ev); },
      });
    } else {
      this._removeEvent(ev);
    }
    this.closeEventModal();
  }

  private _removeEvent(ev: CalEvent) {
    this.events = this.events.filter(e => e !== ev);
    this.generateDays();
    if (!this.bucketListComponent) return;
    const idx = ev.item.item_id
      ? this.bucketListComponent.bucketList.findIndex(i => i.item_id === ev.item.item_id)
      : this.bucketListComponent.bucketList.findIndex(i => i.name === ev.item.name);
    if (idx !== -1) {
      const matched = this.bucketListComponent.bucketList[idx];
      this.bucketListComponent.bucketList.splice(idx, 1);
      if (this.tripId && matched.item_id) this.tripSvc.deleteItem(this.tripId, matched.item_id).subscribe();
    } else if (this.tripId && ev.item.item_id) {
      this.tripSvc.deleteItem(this.tripId, ev.item.item_id).subscribe();
    }
  }

  onBucketItemDeleted(item: BucketItem) {
    const matches = (e: CalEvent) =>
      (item.item_id && e.item.item_id && e.item.item_id === item.item_id) ||
      e.item.name === item.name;
    const toDelete = this.events.filter(matches);
    toDelete.forEach(ev => {
      if (ev.event_id && this.tripId) this.tripSvc.deleteEvent(this.tripId, ev.event_id).subscribe();
    });
    this.events = this.events.filter(e => !matches(e));
    this.generateDays();
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  allowCalendarDrop = (_drag: CdkDrag<any>, _drop: CdkDropList<DayCell>) => true;

  dropOnDay(event: CdkDragDrop<DayCell>, cell: DayCell) {
    if (event.previousContainer.id === 'bucketList') {
      const item = event.item.data as BucketItem;
      const idx = this.bucketListComponent.bucketList.findIndex(i => i === item);
      if (idx !== -1) this.bucketListComponent.bucketList.splice(idx, 1);

      // Conflict warning
      if (cell.events.length > 0) {
        this.showToast(`⚠️ ${cell.id} already has ${cell.events.length} event(s)`);
      }

      // Show time picker before saving
      this.pendingDrop = { item, cell };
      this.dropStartTime = '09:00';
      this.dropEndTime = '11:00';
      this.showTimePicker = true;
      this.selectedDate = cell.id;

    } else if (event.previousContainer !== event.container) {
      const calEvent = event.item.data as CalEvent;
      const prevCell = event.previousContainer.data as DayCell;
      const evIdx = prevCell.events.findIndex(e => e === calEvent);
      if (evIdx > -1) prevCell.events.splice(evIdx, 1);
      calEvent.date = cell.id; cell.events.push(calEvent); this.selectedDate = cell.id;
    }
  }

  confirmDrop() {
    if (!this.pendingDrop) return;
    const { item, cell } = this.pendingDrop;
    this.showTimePicker = false;

    if (this.tripId) {
      this.tripSvc.createEvent(this.tripId, {
        title: item.name, event_date: cell.id,
        bucket_item_id: item.item_id,
        location_name: item.location || undefined,
        start_time: this.dropStartTime || undefined,
        end_time: this.dropEndTime || undefined,
      }).subscribe({
        next: (saved) => {
          const e: CalEvent = { event_id: saved.event_id, date: cell.id, item,
            start_time: this.dropStartTime, end_time: this.dropEndTime };
          this.events.push(e); this._sortAndGenerate();
          this.showToast('✅ Added to calendar');
        },
        error: () => {
          const e: CalEvent = { date: cell.id, item };
          this.events.push(e); this._sortAndGenerate();
        },
      });
    } else {
      const e: CalEvent = { date: cell.id, item }; this.events.push(e); this._sortAndGenerate();
    }
    this.pendingDrop = null;
  }

  cancelDrop() {
    if (this.pendingDrop) {
      // Return item to bucket list
      this.bucketListComponent.bucketList.push(this.pendingDrop.item);
    }
    this.pendingDrop = null;
    this.showTimePicker = false;
  }

  private _sortAndGenerate() {
    // Sort events by date then time
    this.events.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
    this.generateDays();
  }

  dropToBucketList(event: CdkDragDrop<any>) {
    if (event.previousContainer.id !== 'bucketList') {
      const calEvent = event.item.data as CalEvent;
      if (calEvent.event_id && this.tripId) this.tripSvc.deleteEvent(this.tripId, calEvent.event_id).subscribe();
      const gi = this.events.findIndex(e => e === calEvent);
      if (gi > -1) this.events.splice(gi, 1);
      const prevCell = event.previousContainer.data as DayCell;
      if (prevCell?.events) { const ei = prevCell.events.findIndex(e => e === calEvent); if (ei > -1) prevCell.events.splice(ei, 1); }
      this.bucketListComponent.bucketList.push(calEvent.item);
    }
  }

  exportICS() {
    if (!this.tripId) return;
    window.open(this.tripSvc.exportIcsUrl(this.tripId), '_blank');
  }

  // ── Send Invite ───────────────────────────────────────────────────────────

  openInviteModal() {
    this.inviteEmail = ''; this.invitePermission = 'viewer';
    this.inviteSaving = false; this.inviteSuccess = false; this.inviteError = '';
    this.showInviteModal = true;
  }

  closeInviteModal() { this.showInviteModal = false; }

  sendInvite() {
    if (!this.inviteEmail.trim() || !this.tripId || this.inviteSaving) return;
    this.inviteSaving = true;
    this.tripSvc.createInvite(this.tripId, this.inviteEmail.trim(), this.invitePermission).subscribe();
    this.closeInviteModal();
    this.showToast('Email sent! If that address exists, they\'ll receive an invite.');
  }

  // ── View Invites ──────────────────────────────────────────────────────────

  openInvitesList() {
    this.showInvitesListModal = true;
    this.invitesLoading = this.invitesList.length === 0;
    this.tripSvc.getOrCreateTrip().subscribe({
      next: (id) => {
        this.tripSvc.listInvites(id).subscribe({
          next: (list) => { this.invitesList = list; this.invitesLoading = false; },
          error: () => { this.invitesLoading = false; },
        });
      },
      error: () => { this.invitesLoading = false; },
    });
  }

  closeInvitesList() { this.showInvitesListModal = false; }

  statusColor(status: string): string {
    if (status === 'accepted') return 'text-green-400';
    if (status === 'declined') return 'text-red-400';
    return 'text-yellow-400';
  }

  prevMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1); this.generateDays(); }
  nextMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1); this.generateDays(); }

  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}