import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (req.url.startsWith(environment.apiBase)) {
    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': '1',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    req = req.clone({ setHeaders: headers });
  }
  return next(req);
};