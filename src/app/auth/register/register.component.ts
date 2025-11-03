import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterResponseDTO } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

