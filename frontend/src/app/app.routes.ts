import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup';
import { ChatComponent } from './chat/chat';
import { BucketList } from './bucket-list/bucket-list';
import { LoginComponent } from './login/login';
import { CalendarComponent } from './calendar/calendar';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'signup', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'bucketlist', component: BucketList, canActivate: [authGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
];
