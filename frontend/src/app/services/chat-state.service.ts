import { Injectable } from '@angular/core';

export interface Activity {
  time: string;      // "09:00" 24h format
  end_time?: string; // "11:00"
  activity: string;
  location: string;
  description: string;
  duration?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
}

export interface Hotel {
  name: string;
  address: string;
  description: string;
  price_range: string;
}

export interface TripPlan {
  destination: string;
  duration: string;
  overview: string;
  hotel?: Hotel;
  days: DayPlan[];
  tips: string[];
  total_budget?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  plan?: TripPlan;
}

export interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  messages: ChatMessage[];
  lastPlan: TripPlan | null;
}

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  sessions: ChatSession[] = [];
  currentSessionId: string | null = null;

  get currentSession(): ChatSession | null {
    return this.sessions.find(s => s.id === this.currentSessionId) || null;
  }

  get messages(): ChatMessage[] {
    return this.currentSession?.messages || [];
  }

  get lastPlan(): TripPlan | null {
    return this.currentSession?.lastPlan || null;
  }

  getOrCreateSession(): ChatSession {
    if (this.currentSession) return this.currentSession;
    return this.newSession();
  }

  newSession(): ChatSession {
    const session: ChatSession = {
      id: Date.now().toString(),
      name: 'New Chat',
      createdAt: new Date(),
      messages: [],
      lastPlan: null,
    };
    this.sessions.unshift(session);
    this.currentSessionId = session.id;
    return session;
  }

  switchSession(id: string) {
    this.currentSessionId = id;
  }

  add(msg: ChatMessage) {
    const session = this.getOrCreateSession();
    session.messages.push(msg);
    if (msg.plan) session.lastPlan = msg.plan;
    if (session.messages.length === 1 && msg.role === 'user') {
      session.name = msg.text.length > 35 ? msg.text.substring(0, 35) + '...' : msg.text;
    }
  }

  clearCurrent() {
    if (this.currentSession) {
      this.currentSession.messages = [];
      this.currentSession.lastPlan = null;
      this.currentSession.name = 'New Chat';
    }
  }

  deleteSession(id: string) {
    this.sessions = this.sessions.filter(s => s.id !== id);
    if (this.currentSessionId === id) {
      this.currentSessionId = this.sessions[0]?.id || null;
    }
  }
}