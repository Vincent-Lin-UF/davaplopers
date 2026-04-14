import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  user_id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:8000/api/auth';

  constructor(private http: HttpClient) {}

  signup(payload: SignupPayload): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.base}/signup`, payload);
  }

  saveSession(user: SignupResponse): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): SignupResponse | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  logout(): void {
    localStorage.removeItem('user');
  }
}
