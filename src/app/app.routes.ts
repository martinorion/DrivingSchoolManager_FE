import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { guestGuard } from './auth/guards/guest.guard';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ConfirmAccountComponent } from './auth/confirm-account/confirm-account.component';
import { MainPageComponent } from './main-page/main-page.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';

export const routes: Routes = [
  { path: '', component: MainPageComponent, pathMatch: 'full', data: { title: 'Domov' } },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], data: { title: 'Prihlásenie' } },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard], data: { title: 'Registrácia' } },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard], data: { title: 'Obnovenie hesla' } },
  { path: 'confirm-account', component: ConfirmAccountComponent, canActivate: [guestGuard], data: { title: 'Potvrdenie účtu' } },
  { path: 'waiting-room', component: WaitingRoomComponent, data: { title: 'Čakáreň' } },
  { path: '**', redirectTo: '' }
];
