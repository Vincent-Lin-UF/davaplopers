import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_time?: string;
  end_time?: string;
  location?: string;
  description?: string;
  bucket_item_id?: string;
}

interface CalendarDay {
  day: number | null;
  date: string | null;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit {
  today = new Date();
  currentYear = this.today.getFullYear();
  currentMonth = this.today.getMonth(); // 0-indexed

  events: CalendarEvent[] = [];
  weeks: CalendarDay[][] = [];


  showAddModal = false;
  selectedDate = '';
  newTitle = '';
  newLocation = '';
  newDescription = '';
  newStartTime = '';
  newEndTime = '';
  addLoading = false;

 
  showDetailModal = false;
  detailEvent: CalendarEvent | null = null;

  readonly MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  readonly DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadEvents();
  }


  loadEvents() {
    this.http.get<CalendarEvent[]>(`${this.API}/calendar-events`).subscribe({
      next: (events: CalendarEvent[]) => {
        this.events = events;
        this.buildCalendar();
      },
      error: () => this.buildCalendar(),
    });
  }

  

  buildCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0 = Sun

    const days: CalendarDay[] = [];


    for (let i = 0; i < startDow; i++) {
      days.push({ day: null, date: null, events: [] });
    }


    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = this._toDateStr(this.currentYear, this.currentMonth + 1, d);
      days.push({
        day: d,
        date: dateStr,
        events: this.events.filter((e) => e.date === dateStr),
      });
    }

    while (days.length % 7 !== 0) {
      days.push({ day: null, date: null, events: [] });
    }

    
    this.weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.weeks.push(days.slice(i, i + 7));
    }
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.buildCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.buildCalendar();
  }

  goToToday() {
    this.currentYear = this.today.getFullYear();
    this.currentMonth = this.today.getMonth();
    this.buildCalendar();
  }

  

  openAddModal(date: string | null) {
    if (!date) return;
    this.selectedDate = date;
    this.newTitle = '';
    this.newLocation = '';
    this.newDescription = '';
    this.newStartTime = '';
    this.newEndTime = '';
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  addEvent() {
    if (!this.newTitle.trim() || this.addLoading) return;

    const payload = {
      title: this.newTitle.trim(),
      date: this.selectedDate,
      location: this.newLocation.trim() || undefined,
      description: this.newDescription.trim() || undefined,
      start_time: this.newStartTime || undefined,
      end_time: this.newEndTime || undefined,
    };

    this.addLoading = true;

    this.http.post<CalendarEvent>(`${this.API}/calendar-events`, payload).subscribe({
      next: (event) => {
        this.events.push(event);
        this.buildCalendar();
        this.closeAddModal();
        this.addLoading = false;
      },
      error: () => {
        // Fallback: add locally
        const local: CalendarEvent = {
          id: `local-${Date.now()}`,
          title: payload.title,
          date: payload.date,
          location: payload.location,
          description: payload.description,
          start_time: payload.start_time,
          end_time: payload.end_time,
        };
        this.events.push(local);
        this.buildCalendar();
        this.closeAddModal();
        this.addLoading = false;
      },
    });
  }

  

  openDetail(event: CalendarEvent) {
    this.detailEvent = event;
    this.showDetailModal = true;
  }

  closeDetail() {
    this.showDetailModal = false;
    this.detailEvent = null;
  }

  deleteEvent(eventId: string) {
    this.http.delete(`${this.API}/calendar-events/${eventId}`).subscribe({
      next: () => this._removeEventLocally(eventId),
      error: (_err: unknown) => this._removeEventLocally(eventId),
    });
  }

  private _removeEventLocally(id: string) {
    this.events = this.events.filter((e) => e.id !== id);
    this.buildCalendar();
    this.closeDetail();
  }

  

  exportICS() {
    window.open(`${this.API}/export/ics`, '_blank');
  }

  googleCalendarLink(event: CalendarEvent): string {
    const d = event.date.replace(/-/g, '');
    const parts = event.date.split('-');
    const next = new Date(+parts[0], +parts[1] - 1, +parts[2] + 1);
    const nd = this._toDateStr(next.getFullYear(), next.getMonth() + 1, next.getDate()).replace(/-/g, '');

    const p = new URLSearchParams({ text: event.title, dates: `${d}/${nd}` });
    if (event.location) p.set('location', event.location);
    if (event.description) p.set('details', event.description);
    return `https://calendar.google.com/calendar/r/eventedit?${p.toString()}`;
  }

  

  isToday(date: string | null): boolean {
    if (!date) return false;
    const t = this.today;
    return date === this._toDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }

  private _toDateStr(y: number, m: number, d: number): string {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
}