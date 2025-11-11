import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { guestGuard } from './auth/guards/guest.guard';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ConfirmAccountComponent } from './auth/reset-account/confirm-account.component';
import { MainPageComponent } from './main-page/main-page.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { instructorOrgRedirectGuard } from './auth/guards/instructor-org-redirect.guard';
import { authGuard } from './auth/guards/auth.guard';
import { ConfirmVerificationComponent } from './auth/confirm-verification/confirm-verification.component';
import { InstructorsComponent } from './instructors/instructors.component';
import { instructorNoOrgGuard } from './auth/guards/instructor-no-org.guard';
import { MembersComponent } from './members/members.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: MainPageComponent, canActivate: [instructorOrgRedirectGuard], data: { title: 'Dashboard' } },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], data: { title: 'Prihlásenie' } },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard], data: { title: 'Registrácia' } },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard], data: { title: 'Obnovenie hesla' } },
  { path: 'reset-account', component: ConfirmAccountComponent, canActivate: [guestGuard], data: { title: 'Potvrdenie účtu' } },
  { path: 'confirm-verification', component: ConfirmVerificationComponent, data: { title: 'Overenie účtu' } },
  { path: 'waiting-room', component: WaitingRoomComponent, canActivate: [authGuard], data: { title: 'Čakáreň' } },
  { path: 'members', component: MembersComponent, canActivate: [authGuard], data: { title: 'Členovia' } },
  { path: 'instructors', component: InstructorsComponent, canActivate: [instructorNoOrgGuard], data: { title: 'Inštruktori' } },
  { path: '**', redirectTo: 'dashboard' }
];
