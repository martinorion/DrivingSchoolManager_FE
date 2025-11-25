import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { guestGuard } from './auth/guards/guest.guard';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ResetAccountComponent } from './auth/reset-account/reset-account.component';
import { MainPageComponent } from './main-page/main-page.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { instructorOrgRedirectGuard } from './auth/guards/instructor-org-redirect.guard';
import { authGuard } from './auth/guards/auth.guard';
import { ConfirmVerificationComponent } from './auth/confirm-verification/confirm-verification.component';
import { InstructorRequestComponent } from './instructor-request/instructor-request-component';
import { instructorNoOrgGuard } from './auth/guards/instructor-no-org.guard';
import { MembersComponent } from './members/members.component';
import { VehiclesMaterialComponent } from './vehicles/vehicles-material.component';
import { instructorWithOrgGuard } from './auth/guards/instructor-with-org.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: MainPageComponent, canActivate: [instructorOrgRedirectGuard], data: { title: 'Organizácie' } },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], data: { title: 'Prihlásenie' } },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard], data: { title: 'Registrácia' } },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard], data: { title: 'Obnovenie hesla' } },
  { path: 'reset-account', component: ResetAccountComponent, canActivate: [guestGuard], data: { title: 'Potvrdenie účtu' } },
  { path: 'confirm-verification', component: ConfirmVerificationComponent,canActivate: [guestGuard], data: { title: 'Overenie účtu' } },
  { path: 'waiting-room', component: WaitingRoomComponent, canActivate: [authGuard], data: { title: 'Čakáreň' } },
  { path: 'members', component: MembersComponent, canActivate: [authGuard], data: { title: 'Členovia' } },
  { path: 'instructors', component: InstructorRequestComponent, canActivate: [instructorNoOrgGuard], data: { title: 'Inštruktori' } },
  { path: 'vehicles', component: VehiclesMaterialComponent, canActivate: [instructorWithOrgGuard], data: { title: 'Vozidlá' } },
  { path: '**', redirectTo: 'dashboard' }
];
