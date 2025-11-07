import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, finalize } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  phone: string;
  confirmPassword: string;
  firstName: string;
  surname: string;
  authority: 'STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR';
  registrationKey?: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  authority: string;
}

export interface RegisterResponseDTO {
  status: 'success' | 'error';
  message: string;
}

export interface ConfirmAccountRequestDTO {
  token: string;
  password?: string;
}

const TOKEN_KEY = 'auth_token';
const AUTHORITY_KEY = 'auth_authority';
const EXPIRES_KEY = 'auth_expires_at';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(this.readToken());
  readonly token = computed(() => this._token());
  readonly isAuthenticated = computed(() => !!this._token());

  private readonly baseUrl = 'http://localhost:8080/api';

  login(payload: LoginRequest): Observable<void> {
    return this.http.post<LoginResponseDTO>(`${this.baseUrl}/login`, payload).pipe(
      tap(res => this.setLoginState(res)),
      map(() => void 0)
    );
  }

  register(payload: RegisterRequest): Observable<RegisterResponseDTO> {
    return this.http.post<RegisterResponseDTO>(`${this.baseUrl}/register`, payload);
  }

  // Sends a confirmation request; backend should validate token and optionally set password
  confirmAccount(token: string, password?: string): Observable<void> {
    const body: ConfirmAccountRequestDTO =
      password && password.trim().length > 0 ? { token, password } : { token };
    return this.http.post<void>(`${this.baseUrl}/confirm-account`, body);
  }

  verifyAccount(token: string): Observable<void> {
    return this.confirmAccount(token)
  }

  // Starts password reset flow by email
  resetPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset-password`, { email });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      map(() => void 0),
      finalize(() => this.clearState())
    );
  }

  forceLogout(): void {
    this.clearState();
  }

  private setLoginState(res: LoginResponseDTO): void {
    const { accessToken, authority } = res;
    const expiresAt = this.decodeExpiry(accessToken);
    this.setToken(accessToken);
    try {
      localStorage.setItem(AUTHORITY_KEY, authority ?? '');
      localStorage.setItem(EXPIRES_KEY, expiresAt.toString());
    } catch {}
  }

  private setToken(token: string | null): void {
    this._token.set(token);
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }

  private clearState(): void {
    this.setToken(null);
    try {
      localStorage.removeItem(AUTHORITY_KEY);
      localStorage.removeItem(EXPIRES_KEY);
    } catch {}
  }

  private readToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      const exp = this.decodeExpiry(token);
      if (Date.now() >= exp) {
        this.clearState();
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  private decodeExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000;
    } catch {
      return 0;
    }
  }

  // Role helpers based on stored authority string from login response
  getAuthority(): string | null {
    try { return localStorage.getItem(AUTHORITY_KEY); } catch { return null; }
  }

  hasRole(role: 'USER' | 'INSTRUCTOR' | string): boolean {
    const a = this.getAuthority();
    return (a ?? '').toUpperCase() === String(role).toUpperCase();
  }
}
