import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { usernameValidators, passwordValidators, getErrorMessage } from '../../validators/form-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    username: ['', usernameValidators],
    password: ['', passwordValidators],
  });

  // Delegate to shared error message helper
  getMessage(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[controlName];
    return getErrorMessage(controlName as string, control, this.form);
  }

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
