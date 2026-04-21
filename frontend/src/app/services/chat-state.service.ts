import { Injectable } from '@angular/core';

export interface Activity {
  time: string;      // "09:00" 24h format
  end_time?: string; // "11:00"
  activity: string;
  location: string;
  description: string;
  duration?: string;
  image?: string;
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

const STORAGE_KEY = 'chat_sessions';

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  sessions: ChatSession[] = [];
  currentSessionId: string | null = null;

  constructor() {
    this._load();
  }

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
    this._save();
    return session;
  }

  switchSession(id: string) {
    this.currentSessionId = id;
    this._save();
  }

  add(msg: ChatMessage) {
    const session = this.getOrCreateSession();
    session.messages.push(msg);
    if (msg.plan) session.lastPlan = msg.plan;
    if (session.messages.length === 1 && msg.role === 'user') {
      session.name = msg.text.length > 35 ? msg.text.substring(0, 35) + '...' : msg.text;
    }
    this._save();
  }

  clearCurrent() {
    if (this.currentSession) {
      this.currentSession.messages = [];
      this.currentSession.lastPlan = null;
      this.currentSession.name = 'New Chat';
      this._save();
    }
  }

  deleteSession(id: string) {
    this.sessions = this.sessions.filter(s => s.id !== id);
    if (this.currentSessionId === id) {
      this.currentSessionId = this.sessions[0]?.id || null;
    }
    this._save();
  }

  clearAll() {
    this.sessions = [];
    this.currentSessionId = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  private _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessions: this.sessions,
        currentSessionId: this.currentSessionId,
      }));
    } catch {}
  }

  private _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.sessions = (data.sessions || []).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
      }));
      this.currentSessionId = data.currentSessionId || null;
    } catch {}
  }
}
