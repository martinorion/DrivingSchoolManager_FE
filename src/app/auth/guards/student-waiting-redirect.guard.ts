import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { WaitingRoomService } from '../../services/waiting-room.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { OrganizationService } from '../../services/organization.service';

// If user is STUDENT and has a pending waiting-room request, redirect to /waiting-room.
// But if the student already belongs to an organization, allow access to dashboard.
export const studentWaitingRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const waiting = inject(WaitingRoomService);
  const orgService = inject(OrganizationService);
  const router = inject(Router);

  if (!auth.isAuthenticated() || !auth.hasRole('STUDENT')) {
    return true; // not a student, let other guards handle
  }

  return orgService.getCurrentOrganization().pipe(
    switchMap((org) => {
      if (org) {
        return of(true); // student already in org, don't redirect to waiting-room
      }
      return waiting.getUsersWaitingRoom().pipe(
        map(dto => (dto ? router.createUrlTree(['/waiting-room']) : true))
      );
    }),
    catchError(() => of(true))
  );
};
