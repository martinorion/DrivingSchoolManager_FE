import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

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

  protected readonly pageTitle = signal<string>('');

  constructor() {
    // Initialize and react to route changes
    this.updatePageTitle();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.updatePageTitle());
  }

  private updatePageTitle() {
    // Traverse to the deepest activated route
    let r: ActivatedRoute | null = this.route;
    while (r?.firstChild) r = r.firstChild;

    const dataTitle = r?.snapshot.data?.['title'] as string | undefined;
    if (dataTitle) {
      this.pageTitle.set(dataTitle);
      return;
    }

    // Fallback: build from URL
    const url = this.router.url.split('?')[0].split('#')[0];
    const parts = url.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';

    const pretty = last
      ? last.replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase())
      : 'Domov';

    this.pageTitle.set(pretty);
  }

  protected logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
