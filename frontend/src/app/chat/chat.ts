import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { TripService } from '../services/trip.service';
import { ChatStateService, ChatMessage, TripPlan, ChatSession } from '../services/chat-state.service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './chat.html',
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  get sessions() { return this.chatState.sessions; }
  get currentSession() { return this.chatState.currentSession; }
  get messages() { return this.chatState.messages; }

  input = '';
  loading = false;
  tripId: number | null = null;
  showSidebar = false;
  expandedDay: number | null = null;

  showCalendarModal = false;
  calendarStartDate = '';
  calendarSaving = false;
  pendingPlan: TripPlan | null = null;

  private _sub?: Subscription;

  constructor(
    private http: HttpClient,
    private tripSvc: TripService,
    public chatState: ChatStateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.chatState.getOrCreateSession();
    this.tripSvc.getOrCreateTrip().subscribe({
      next: (id) => { this.tripId = id; },
      error: () => {},
    });
  }

  ngAfterViewChecked() {
    try { this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  newChat() { this.chatState.newSession(); this.expandedDay = null; this.showSidebar = false; }

  switchSession(session: ChatSession) { this.chatState.switchSession(session.id); this.expandedDay = null; this.showSidebar = false; }

  deleteSession(session: ChatSession, e: Event) {
    e.stopPropagation();
    this.chatState.deleteSession(session.id);
    if (this.chatState.sessions.length === 0) this.chatState.newSession();
  }

  clearChat() { this.chatState.clearCurrent(); this.expandedDay = null; }

  // ── Send / Stop ───────────────────────────────────────────────────────────

  send() {
    const text = this.input.trim();
    if (!text || this.loading) return;

    this.chatState.add({ role: 'user', text });
    this.input = '';
    this.loading = true;
    this.cdr.detectChanges();

    this._sub = this.http.post<{ message: string }>('http://localhost:8000/api/chat', {
      message: text,
      trip_id: this.tripId,
    }).subscribe({
      next: (res) => {
        this.handleResponse(res);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chatState.add({ role: 'assistant', text: 'Something went wrong. Please try again.' });
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  stopGenerating() {
    this._sub?.unsubscribe();
    this.loading = false;
    this.cdr.detectChanges();
  }

  // ── Response handling ─────────────────────────────────────────────────────

  handleResponse(res: { message: string }) {
    const parsed = this.tryParse(res.message);
    if (!parsed) {
      this.chatState.add({ role: 'assistant', text: res.message });
      return;
    }
    if (parsed.action === 'add_to_bucket' && parsed.items?.length) {
      this.chatState.add({ role: 'assistant', text: `✅ Adding ${parsed.items.length} item(s) to your bucket list...` });
      if (this.tripId) {
        parsed.items.forEach((item: any) => {
          this.tripSvc.createItem(this.tripId!, {
            title: item.title,
            location_name: item.location,
            category: item.category || 'Travel',
            priority: item.priority || 'medium',
          }).subscribe();
        });
      }
      return;
    }
    if (parsed.action === 'remove_from_bucket' && parsed.titles?.length) {
      this.chatState.add({ role: 'assistant', text: `🗑 Removing "${parsed.titles.join(', ')}" from your bucket list.` });
      return;
    }
    if (parsed.followup) {
      this.chatState.add({ role: 'assistant', text: parsed.message });
      return;
    }
    // Full trip plan
    this.chatState.add({ role: 'assistant', text: '', plan: parsed });
    this.expandedDay = 1;
  }

  tryParse(text: string): any | null {
    try {
      return JSON.parse(text.trim().replace(/```json|```/g, '').trim());
    } catch { return null; }
  }

  toggleDay(day: number) { this.expandedDay = this.expandedDay === day ? null : day; }

  mapUrl(location: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }

  // ── Add to Calendar ───────────────────────────────────────────────────────

  openCalendarModal(plan: TripPlan) {
    this.pendingPlan = plan;
    this.calendarStartDate = '';
    this.calendarSaving = false;
    this.showCalendarModal = true;
    this.cdr.detectChanges();
  }

  closeCalendarModal() {
    this.showCalendarModal = false;
    this.pendingPlan = null;
    this.calendarSaving = false;
    this.cdr.detectChanges();
  }

  addPlanToCalendar() {
    if (!this.pendingPlan || !this.calendarStartDate || !this.tripId || this.calendarSaving) return;
    this.calendarSaving = true;
    this.cdr.detectChanges();

    const start = new Date(this.calendarStartDate + 'T00:00:00');
    const plan = this.pendingPlan;
    const tripId = this.tripId;
    const days = [...plan.days];
    let index = 0;

    const addNext = () => {
      if (index >= days.length) {
        // All done
        this.calendarSaving = false;
        this.showCalendarModal = false;
        this.pendingPlan = null;
        this.chatState.add({
          role: 'assistant',
          text: `✅ Added all ${days.length} days to your calendar! Head to the Calendar tab to see them.`
        });
        this.cdr.detectChanges();
        return;
      }

      const day = days[index++];
      const date = new Date(start);
      date.setDate(start.getDate() + day.day - 1);
      const dateStr = date.toISOString().split('T')[0];
      const firstAct = day.activities?.[0];
      const lastAct = day.activities?.[day.activities.length - 1];

      this.http.post<any>(`http://localhost:8000/api/trips/${tripId}/events`, {
        title: `Day ${day.day}: ${day.title}`,
        event_date: dateStr,
        start_time: firstAct?.time || null,
        end_time: lastAct?.end_time || null,
        location_name: firstAct?.location || plan.destination,
      }).subscribe({
        next: () => { this.cdr.detectChanges(); addNext(); },
        error: () => { this.cdr.detectChanges(); addNext(); },
      });
    };

    addNext();
  }
}