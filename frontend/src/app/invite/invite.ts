import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

interface InviteView {
  invite_email: string;
  permission_level: string;
  invite_status: string;
  trip_name: string | null;
  inviter_email: string;
}

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invite.html',
})
export class InviteComponent implements OnInit {
  token = '';
  loading = true;
  invite: InviteView | null = null;
  error = '';
  submitting = false;
  done: 'accepted' | 'declined' | '' = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) { this.router.navigate(['/']); return; }

    this.http.get<InviteView>(`${environment.apiBase}/api/invites/by-token/${this.token}`).subscribe({
      next: (inv) => { this.invite = inv; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Invite not found or expired.'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  needsLogin(): boolean { return !this.auth.isLoggedIn(); }

  emailMismatch(): boolean {
    const u = this.auth.getUser();
    return !!(u && this.invite && u.email.toLowerCase() !== this.invite.invite_email.toLowerCase());
  }

  goLogin() {
    this.router.navigate(['/login'], { queryParams: { redirect: `/invite/${this.token}` } });
  }

  goSignup() {
    this.router.navigate(['/signup'], { queryParams: { redirect: `/invite/${this.token}` } });
  }

  logout() { this.auth.logout(); this.router.navigate(['/login'], { queryParams: { redirect: `/invite/${this.token}` } }); }

  respond(status: 'accepted' | 'declined') {
    if (this.submitting || !this.invite) return;
    this.submitting = true;
    this.http.post(`${environment.apiBase}/api/invites/by-token/${this.token}/respond`, { status }).subscribe({
      next: () => { this.done = status; this.submitting = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.error = err?.error?.detail || 'Could not respond to the invite.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToTrip() { this.router.navigate(['/calendar']); }
}
