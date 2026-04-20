import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignupPayload { name: string; email: string; password: string; }
export interface SignupResponse { user_id: number; name: string; email: string; }
export interface LoginPayload { email: string; password: string; }
export interface LoginResponse { access_token: string; token_type: string; user_id: number; name: string; email: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:8000/api/auth';
  constructor(private http: HttpClient) {}

  signup(payload: SignupPayload): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.base}/signup`, payload);
  }
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, payload);
  }
  saveSession(user: SignupResponse | LoginResponse): void {
    if ('access_token' in user) localStorage.setItem('token', user.access_token);
    localStorage.setItem('user', JSON.stringify({ user_id: user.user_id, name: user.name, email: user.email }));
  }
  getUser(): SignupResponse | null { const r = localStorage.getItem('user'); return r ? JSON.parse(r) : null; }
  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!localStorage.getItem('user'); }
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('current_trip_id');
  }
}