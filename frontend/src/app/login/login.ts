import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService, LoginResponse } from '../services/auth.service';
import { environment } from '../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html'
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    const initGoogle = () => {
      google.accounts.id.initialize({
        client_id: '143526963027-1vb8npsrdgjdhg92goh91nekbs79dvib.apps.googleusercontent.com',
        callback: (response: { credential: string }) => this.onGoogleCredential(response.credential),
      });
      google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'filled_black', size: 'large', text: 'continue_with' }
      );
    };

    if (typeof google !== 'undefined') {
      initGoogle();
    } else {
      window.onload = initGoogle;
    }
  }

  private onGoogleCredential(idToken: string) {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.http.post<LoginResponse>(`${environment.apiBase}/api/auth/google`, {
      id_token: idToken,
    }).subscribe({
      next: (res) => {
        this.auth.saveSession(res);
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/chat';
        this.router.navigateByUrl(redirect);
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Google sign-in failed. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        this.auth.saveSession(res);
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/chat';
        this.router.navigateByUrl(redirect);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.status === 401
          ? 'Invalid email or password.'
          : 'Something went wrong. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }
}