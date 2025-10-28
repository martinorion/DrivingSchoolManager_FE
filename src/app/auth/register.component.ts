import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { RegisterResponseDTO } from './auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2>Registrácia</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>
        Používateľské meno
        <input type="text" formControlName="username" required />
      </label>
      <div *ngIf="form.controls.username.invalid && (form.controls.username.dirty || form.controls.username.touched)" style="color:red;">
        Používateľské meno je povinné.
      </div>

      <label>
        Meno
        <input type="text" formControlName="firstName" required />
      </label>
      <div *ngIf="form.controls.firstName.invalid && (form.controls.firstName.dirty || form.controls.firstName.touched)" style="color:red;">
        Meno je povinné.
      </div>

      <label>
        Priezvisko
        <input type="text" formControlName="surname" required />
      </label>
      <div *ngIf="form.controls.surname.invalid && (form.controls.surname.dirty || form.controls.surname.touched)" style="color:red;">
        Priezvisko je povinné.
      </div>

      <label>
        Email
        <input type="email" formControlName="email" required />
      </label>
      <div *ngIf="form.controls.email.invalid && (form.controls.email.dirty || form.controls.email.touched)" style="color:red;">
        Zadajte platný email.
      </div>

      <label>
        Telefón
        <input type="tel" formControlName="phone" required />
      </label>
      <div *ngIf="form.controls.phone.invalid && (form.controls.phone.dirty || form.controls.phone.touched)" style="color:red;">
        Telefón je povinný.
      </div>

      <label>
        Heslo
        <input type="password" formControlName="password" required />
      </label>
      <div *ngIf="form.controls.password.invalid && (form.controls.password.dirty || form.controls.password.touched)" style="color:red;">
        Heslo je povinné.
      </div>

      <label>
        Potvrdenie hesla
        <input type="password" formControlName="confirmPassword" required />
      </label>
      <div *ngIf="(form.errors?.['passwordMismatch']) && (form.controls.confirmPassword.dirty || form.controls.confirmPassword.touched)" style="color:red;">
        Heslá sa nezhodujú.
      </div>

      <button type="submit" [disabled]="form.invalid || loading()">Registrovať</button>
      <a routerLink="/login">Máte účet? Prihláste sa</a>

      <p *ngIf="error()" style="color:red;">{{ error() }}</p>
      <p *ngIf="success()" style="color:green;">{{ success() }}</p>
    </form>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group(
    {
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      surname: ['', [Validators.required]],
    },
    { validators: [this.passwordsMatchValidator] }
  );

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value as string | undefined;
    const confirm = group.get('confirmPassword')?.value as string | undefined;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: (res: RegisterResponseDTO) => {
        if (res.status === 'success') {
          this.success.set(res.message || 'Registrácia prebehla úspešne.');
          // po krátkej chvíli presmeruj na login
          setTimeout(() => this.router.navigateByUrl('/login'), 1200);
        } else {
          this.error.set(res.message || 'Registrácia zlyhala.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Registrácia zlyhala.');
        this.loading.set(false);
      },
    });
  }
}
