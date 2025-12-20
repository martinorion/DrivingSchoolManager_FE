import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';
import { OrganizationService, Organization } from './services/organization.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Driving School Manager');
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly org = inject(OrganizationService);

  protected readonly pageTitle = signal<string>('');
  protected readonly menuOpen = signal<boolean>(false);
  protected readonly hasOrg = signal<boolean | null>(null);
  protected readonly orgPending = signal<boolean>(false);

  constructor() {
    this.updatePageTitle();
    this.refreshOrgState();
    // listen to route changes
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();

        this.menuOpen.set(false);
        this.refreshOrgState();
      });
  }

  protected toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  private updatePageTitle() {
    // find deepest activated route
    let r: ActivatedRoute | null = this.route; // current route or null
   // find deepest child, ? because firstChild may be null
    while (r?.firstChild) r = r.firstChild;
    // get title from data property of route in app routes
    const dataTitle = r?.snapshot.data?.['title'] as string | undefined;
    if (dataTitle) {
      this.pageTitle.set(dataTitle);
      return;
    }
  }

  private refreshOrgState() {
    if (this.auth.hasRole('INSTRUCTOR')) {
      // Check if instructor has an org
      this.org.getCurrentOrganization().subscribe({
        next: (current: Organization | null) => {
          const has = !!current;
          this.hasOrg.set(has);
          // org is pending if exists but not accepted
          this.orgPending.set(!!current && current.isAccepted === false);
        },
        error: () => { this.hasOrg.set(false); this.orgPending.set(false); }
      });
    } else {
      this.hasOrg.set(null);
      this.orgPending.set(false);
    }
  }

  protected logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
