import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  // Use inline template with a small auth-aware navbar
  template: `
    <nav class="top-nav">
      <div class="brand">
        <a routerLink="/dashboard" routerLinkActive="active">{{ title() }}</a>
      </div>
      <div class="nav-links">
        @if (auth.isAuthenticated()) {
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <button type="button" (click)="logout()">Odhlásiť</button>
        } @else {
          <a routerLink="/login" routerLinkActive="active">Prihlásenie</a>
          <a routerLink="/register" routerLinkActive="active">Registrácia</a>
        }
      </div>
    </nav>

    <router-outlet />
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('DrivingSchoolManager_FE');
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
