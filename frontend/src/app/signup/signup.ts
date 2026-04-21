import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService, LoginResponse } from '../services/auth.service';
import { environment } from '../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-signup',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signup.html',
})
export class SignupComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
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
        { theme: 'filled_black', size: 'large', text: 'signup_with' }
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
        this.errorMsg = 'Google sign-up failed. Please try again.';
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

    const { firstName, lastName, email, password } = this.form.value;

    this.auth.signup({ name: `${firstName} ${lastName}`, email, password }).subscribe({
      next: (user) => {
        this.auth.saveSession(user);
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/chat';
        this.router.navigateByUrl(redirect);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMsg = 'An account with that email already exists.';
        } else {
          this.errorMsg = 'Something went wrong. Please try again.';
        }
      },
    });
  }
}
