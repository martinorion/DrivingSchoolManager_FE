import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2>Prihlásenie</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>
        Používateľské meno
        <input type="text" formControlName="username" required />
      </label>
      <div *ngIf="form.controls.username.invalid && (form.controls.username.dirty || form.controls.username.touched)" style="color:red;">
        Používateľské meno je povinné.
      </div>

      <label>
        Heslo
        <input type="password" formControlName="password" required />
      </label>
      <div *ngIf="form.controls.password.invalid && (form.controls.password.dirty || form.controls.password.touched)" style="color:red;">
        Heslo je povinné.
      </div>

      <button type="submit" [disabled]="form.invalid || loading()">Prihlásiť</button>
      <a routerLink="/register">Nemáte účet? Registrujte sa</a>
      <a routerLink="/reset-password" style="margin-left: 0.75rem;">Zabudnuté heslo?</a>

      <p *ngIf="error()" style="color:red;">{{ error() }}</p>
    </form>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth
      .login(this.form.getRawValue() as any)
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: (err) => {
          this.error.set(err?.error?.message || 'Prihlásenie zlyhalo.');
          this.loading.set(false);
        },
      });
  }
}
