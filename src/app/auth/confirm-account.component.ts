import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2>Potvrdenie účtu</h2>
    <p>Voliteľne si môžete nastaviť nové heslo. Ak necháte prázdne, účet sa iba aktivuje.</p>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>
        Nové heslo (voliteľné)
        <input type="password" formControlName="password" />
      </label>

      <label>
        Potvrdenie hesla
        <input type="password" formControlName="confirmPassword" />
      </label>
      <div *ngIf="(form.errors?.['passwordMismatch']) && (form.controls.confirmPassword.dirty || form.controls.confirmPassword.touched)" style="color:red;">
        Heslá sa nezhodujú.
      </div>

      <button type="submit" [disabled]="loading()">Potvrdiť účet</button>
      <a routerLink="/login" style="margin-left: 0.75rem;">Späť na prihlásenie</a>

      <p *ngIf="error()" style="color:red;">{{ error() }}</p>
      <p *ngIf="success()" style="color:green;">{{ success() }}</p>
    </form>
  `,
})
export class ConfirmAccountComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group(
    {
      password: [''],
      confirmPassword: [''],
    },
    { validators: [this.passwordsMatchValidator] }
  );

  // Convert to a class method so it is available during form initialization
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value as string | undefined;
    const confirm = group.get('confirmPassword')?.value as string | undefined;
    if (!password && !confirm) return null; // empty is allowed
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('Chýba token v URL.');
      return;
    }

    if (this.form.errors?.['passwordMismatch']) {
      return;
    }

    const password = (this.form.controls.password.value || '') as string;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.auth.confirmAccount(token, password).subscribe({
      next: () => {
        this.success.set('Účet bol potvrdený. Môžete sa prihlásiť.');
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nepodarilo sa potvrdiť účet.');
        this.loading.set(false);
      }
    });
  }
}
