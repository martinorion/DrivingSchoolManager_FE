import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { OrganizationService } from '../../services/organization.service';
import { map, catchError, of } from 'rxjs';

// If user is INSTRUCTOR and already has an organization, redirect from dashboard to waiting-room.
export const instructorOrgRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const org = inject(OrganizationService);
  const router = inject(Router);

  if (!auth.isAuthenticated() || !auth.hasRole('INSTRUCTOR')) {
    return true;
  }

  return org.getCurrentOrganization().pipe(
    map(current => (current ? router.createUrlTree(['/waiting-room']) : true)),
    catchError(() => of(true))
  );
};

