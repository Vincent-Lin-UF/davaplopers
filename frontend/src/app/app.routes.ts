import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup';
import { ChatComponent } from './chat/chat';
import { LoginComponent } from './login/login';

export const routes: Routes = [
  { path: '', component: SignupComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'login', component: LoginComponent }
];
