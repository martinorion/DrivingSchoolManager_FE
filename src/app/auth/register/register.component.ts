import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterResponseDTO } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
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
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z][a-zA-Z0-9._-]*$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(30), Validators.pattern(/.*\d.*/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.pattern(/^[\p{L}' \-]+$/u)]],
      surname: ['', [Validators.required, Validators.pattern(/^[\p{L}' \-]+$/u)]],
      authority: ['STUDENT', [Validators.required]],
      registrationKey: [''],
    },
    { validators: [this.passwordsMatchValidator, this.registrationKeyRequiredValidator] }
  );

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value as string | undefined;
    const confirm = group.get('confirmPassword')?.value as string | undefined;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  }

  private registrationKeyRequiredValidator(group: AbstractControl): ValidationErrors | null {
    const role = (group.get('authority')?.value || 'STUDENT') as string;
    const key = (group.get('registrationKey')?.value || '') as string;
    const needsKey = role === 'INSTRUCTOR' || role === 'ADMIN' || role === 'ADMINISTRATOR';
    if (!needsKey) return null;
    return key && key.trim().length > 0 ? null : { registrationKeyRequired: true };
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
          setTimeout(() => this.router.navigateByUrl('/login'), 1200);
        } else {
          this.error.set(res.message || 'Registrácia zlyhala.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Registrácia zlyhala.');
        this.loading.set(false);
      },
    });
  }
}
