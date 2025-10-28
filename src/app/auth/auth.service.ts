import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

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
}

export interface LoginResponseDTO {
  accessToken: string;
  authority: string;
  expiresAt: string; // ISO datetime string
}

export interface RegisterResponseDTO {
  status: 'success' | 'error';
  message: string;
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

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearState()),
      map(() => void 0)
    );
  }

  // Immediately clear local auth state (no backend call)
  forceLogout(): void {
    this.clearState();
  }

  resetPassword(email: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });
    return this.http.post<any>(`${this.baseUrl}/resetPassword`, email, { headers });
  }

  confirmAccount(token: string, password: string): Observable<void> {
    const params = new HttpParams().set('token', token).set('password', password || '');
    return this.http.post<void>(`${this.baseUrl}/confirm-account`, null, { params });
  }

  // Helpers
  private setLoginState(res: LoginResponseDTO): void {
    const { accessToken, authority, expiresAt } = res;
    this.setToken(accessToken);
    try {
      localStorage.setItem(AUTHORITY_KEY, authority ?? '');
      localStorage.setItem(EXPIRES_KEY, expiresAt ?? '');
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
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
