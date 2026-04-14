import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signup.html',
})
export class SignupComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
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
        this.router.navigate(['/chat']);
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
