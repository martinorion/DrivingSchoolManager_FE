import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2>Obnova hesla</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>
        Email
        <input type="email" formControlName="email" required />
      </label>
      <div *ngIf="form.controls.email.invalid && (form.controls.email.dirty || form.controls.email.touched)" style="color:red;">
        Zadajte platný email.
      </div>

      <button type="submit" [disabled]="form.invalid || loading()">Odoslať inštrukcie</button>
      <a routerLink="/login" style="margin-left: 0.75rem;">Späť na prihlásenie</a>

      <p *ngIf="error()" style="color:red;">{{ error() }}</p>
      <p *ngIf="success()" style="color:green;">{{ success() }}</p>
    </form>
  `,
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const email = this.form.controls.email.value as string;
    this.auth.resetPassword(email).subscribe({
      next: () => {
        this.success.set('Ak účet existuje, poslali sme e-mail s ďalšími inštrukciami.');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nepodarilo sa odoslať požiadavku.');
        this.loading.set(false);
      }
    });
  }
}
