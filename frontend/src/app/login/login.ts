import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

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
    private cdr: ChangeDetectorRef
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
        callback: () => this.router.navigate(['/chat']),
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
        this.router.navigate(['/chat']);
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