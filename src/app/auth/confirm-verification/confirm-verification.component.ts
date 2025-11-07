import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-verification',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  templateUrl: './confirm-verification.component.html',
  styleUrl: './confirm-verification.component.css'
})
export class ConfirmVerificationComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  countdown = signal<number>(5);

  private intervalId: any = null;
  private timeoutId: any = null;

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('Chýba token v URL.');
      this.loading.set(false);
      return;
    }

    this.auth.verifyAccount(token).subscribe({
      next: () => {
        this.loading.set(false);
        this.startCountdown();
      },
      error: () => {
        this.error.set('Overenie zlyhalo. Skúste znova alebo požiadajte o nový email.');
        this.loading.set(false);
      }
    });
  }

  private startCountdown() {
    this.clearTimers();
    this.countdown.set(5);
    this.intervalId = setInterval(() => {
      const v = this.countdown();
      if (v <= 1) {
        this.countdown.set(0);
        this.clearIntervalOnly();
      } else {
        this.countdown.set(v - 1);
      }
    }, 1000);
    this.timeoutId = setTimeout(() => this.goLogin(), 5000);
  }

  goLogin() { this.router.navigateByUrl('/login'); }

  private clearIntervalOnly() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private clearTimers() {
    this.clearIntervalOnly();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  ngOnDestroy(): void { this.clearTimers(); }
}
