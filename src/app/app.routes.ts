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
import { VehiclesComponent } from './vehicles/vehicles.component';
import { instructorWithOrgGuard } from './auth/guards/instructor-with-org.guard';
import { studentWaitingRedirectGuard } from './auth/guards/student-waiting-redirect.guard';
import { GroupsMaterialComponent } from './groups/groups-material.component';
import { MyProfileComponent } from './auth/profile/my-profile.component';
import { VehicleReservationsComponent } from './vehicle-reservations/vehicle-reservations.component';
import { StudentLessonRequestsComponent } from './lessons/student-lesson-requests.component';
import { InstructorIncomingRequestsComponent } from './lessons/instructor-incoming-requests.component';
import { AdminPortalComponent } from './admin/admin-portal.component';
import { InfoAboutAuthorComponent } from './info-about-author/info-about-author.component';
import { GroupAnnouncementsComponent } from './group-announcements/group-announcements.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: MainPageComponent, canActivate: [instructorOrgRedirectGuard, studentWaitingRedirectGuard], data: { title: 'Organizácie' } },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], data: { title: 'Prihlásenie' } },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard], data: { title: 'Registrácia' } },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard], data: { title: 'Obnovenie hesla' } },
  { path: 'reset-account', component: ResetAccountComponent, canActivate: [guestGuard], data: { title: 'Potvrdenie účtu' } },
  { path: 'confirm-verification', component: ConfirmVerificationComponent,canActivate: [guestGuard], data: { title: 'Overenie účtu' } },
  { path: 'waiting-room', component: WaitingRoomComponent, canActivate: [authGuard], data: { title: 'Čakáreň' } },
  { path: 'members', component: MembersComponent, canActivate: [authGuard], data: { title: 'Členovia' } },
  { path: 'instructors', component: InstructorRequestComponent, canActivate: [instructorNoOrgGuard], data: { title: 'Správa organizácie' } },
  { path: 'vehicles', component: VehiclesComponent, canActivate: [instructorWithOrgGuard], data: { title: 'Vozidlá' } },
  { path: 'groups', component: GroupsMaterialComponent, canActivate: [instructorWithOrgGuard], data: { title: 'Skupiny' } },
  { path: 'group-announcements', component: GroupAnnouncementsComponent, canActivate: [authGuard], data: { title: 'Skupinové oznámenia' } },
  { path: 'car-reservations', component: VehicleReservationsComponent, canActivate: [instructorWithOrgGuard], data: { title: 'Rezervácie vozidiel' } },
  { path: 'lesson-requests', component: StudentLessonRequestsComponent, canActivate: [authGuard], data: { title: 'Žiadosti o jazdy' } },
  { path: 'incoming-lesson-requests', component: InstructorIncomingRequestsComponent, canActivate: [instructorWithOrgGuard], data: { title: 'Prichádzajúce žiadosti o jazdy' } },
  { path: 'my-profile', component: MyProfileComponent, canActivate: [authGuard], data: { title: 'Môj profil' } },
  // Admin portal route (visible only to admins by UI; guard just requires auth)
  { path: 'admin', component: AdminPortalComponent, canActivate: [authGuard], data: { title: 'Admin portál' } },
  { path: 'info-about-author', component: InfoAboutAuthorComponent, data: { title: 'Informácie o autorovi' } },
  { path: '**', redirectTo: 'dashboard' }
];
