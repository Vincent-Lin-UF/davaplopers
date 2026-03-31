import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup';
import { ChatComponent } from './chat/chat';
import { BucketList } from './bucket-list/bucket-list';


export const routes: Routes = [
  { path: '', component: SignupComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'bucketlist', component: BucketList}
  
];
