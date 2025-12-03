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
import { usernameValidators, passwordValidators, emailValidators, phoneValidators, nameValidators, matchValidator, getErrorMessage } from '../../validators/form-validators';

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
      username: ['', usernameValidators],
      password: ['', passwordValidators],
      email: ['', emailValidators],
      phone: ['', phoneValidators],
      confirmPassword: ['', [Validators.required, matchValidator('password')]],
      firstName: ['', nameValidators],
      surname: ['', nameValidators],
      authority: ['STUDENT', [Validators.required]],
      registrationKey: [''],
    },
    { validators: [this.registrationKeyRequiredValidator] }
  );

  constructor() {
    // Revalidate confirmPassword when password changes so mismatch updates live
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  private registrationKeyRequiredValidator(group: AbstractControl): ValidationErrors | null {
    const role = (group.get('authority')?.value || 'STUDENT') as string;
    const key = (group.get('registrationKey')?.value || '') as string;
    const needsKey = role === 'INSTRUCTOR' || role === 'ADMIN' || role === 'ADMINISTRATOR';
    if (!needsKey) return null;
    return key && key.trim().length > 0 ? null : { registrationKeyRequired: true };
  }

  // Delegate to shared error message helper
  getMessage(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[controlName];
    return getErrorMessage(controlName as string, control, this.form);
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
