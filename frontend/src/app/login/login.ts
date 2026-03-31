import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.html'
})

export class LoginComponent implements OnInit {
  constructor(private router: Router) {}
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
}