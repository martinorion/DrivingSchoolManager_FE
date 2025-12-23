import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, tap, map, finalize, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

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
  refreshToken: string;
  authority: string;
  expiresAt?: string;
}

export interface RegisterResponseDTO {
  status: 'success' | 'error';
  message: string;
}

export interface ConfirmAccountRequestDTO {
  token: string;
  password?: string;
}

export interface EditProfileDTO {
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  surname?: string | null;
  password?: string | null; // optional change
}

export interface EditProfileResponseDTO {
  status: 'success' | 'error';
  message: string;
  user?: any;
}

// Define user DTO returned by getUserProfile
export interface UserDTO {
  id?: number;
  username: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  surname?: string | null;
  authority?: string;
}

// Add student status DTO for displaying counts on dashboard
export interface StudentStatusDTO {
  drivingLessonsCount: number | null;
  drivingSimulationsCount: number | null;
  theoryLessonsCount: number | null;
}

const AUTH_STATE_KEY = 'auth_state';
const REFRESH_IN_COOKIE = true;

interface AuthState {
  accessToken: string;
  refreshToken?: string; // only when REFRESH_IN_COOKIE = false
  expiresAt?: number | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(this.readTokenFromStorage());
  private readonly _expiresAt = signal<number | null>(this.readExpiryFromStorage());

  readonly token = computed(() => this._token());
  readonly isAuthenticated = computed(() => !!this._token()); // simple check if token exists
  readonly expiresAtMs = computed(() => this._expiresAt());

  private readonly baseUrl = 'http://localhost:8080/api/auth';

  login(loginRequest: LoginRequest): Observable<void> {
    return this.http.post<LoginResponseDTO>(`${this.baseUrl}/login`, loginRequest,  REFRESH_IN_COOKIE ? { withCredentials: true } : {}).pipe(
      tap(res => this.setLoginState(res)),
      map(() => void 0) // map to void, we don't need to expose the response
    );
  }

  register(registerRequest: RegisterRequest): Observable<RegisterResponseDTO> {
    return this.http.post<RegisterResponseDTO>(`${this.baseUrl}/register`, registerRequest);
  }

  getUserProfile(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/get-profile`, { withCredentials: true });
  }

  // Add edit-profile call. Backend returns status/message/user in body.
  editProfile(dto: EditProfileDTO): Observable<EditProfileResponseDTO> {
    return this.http.put<EditProfileResponseDTO>(`${this.baseUrl}/edit-profile`, dto, { withCredentials: true });
  }

  confirmAccount(token: string, password?: string): Observable<void> {
    const body: ConfirmAccountRequestDTO =
      password && password.trim().length > 0 ? { token, password } : { token };
    return this.http.post<void>(`${this.baseUrl}/confirm-account`, body);
  }

  verifyAccount(token: string): Observable<void> {
    return this.confirmAccount(token)
  }

  resetPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset-password`, { email });
  }

  // Fetch student status (remaining lessons counts)
  getStudentStatus(): Observable<StudentStatusDTO> {
    return this.http.get<StudentStatusDTO>(`${this.baseUrl}/get-student-status`, { withCredentials: true });
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
    const accessToken = res.accessToken || '';
    const existing = this.readAuthState();
    // Only persist refresh token in local storage if not using HttpOnly cookie mode
    const refreshToken = REFRESH_IN_COOKIE ? '' : (res.refreshToken || existing?.refreshToken || '');

    const decodedExp = this.decodeExpiry(accessToken);
    let expiresAt = decodedExp;

    if ((!decodedExp || decodedExp === 0) && res.expiresAt) {
      const parsed = Date.parse(res.expiresAt);
      if (!isNaN(parsed)) expiresAt = parsed;
    }

    const newState: AuthState = {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt: expiresAt ?? undefined,
    };

    this.persistAuthState(newState);

  }

  private clearState(preserveRefresh: boolean = false): void {
    if (preserveRefresh) {
      if (REFRESH_IN_COOKIE) {
        this._token.set(null);
        this._expiresAt.set(null);
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ accessToken: '' } as AuthState));
        return;
      }
      const existing = this.readAuthState();
      const refreshToken = existing?.refreshToken;
      const newState: AuthState | null = refreshToken ? { accessToken: '', refreshToken } : null;
      this._token.set(null);
      this._expiresAt.set(null);
      this.persistAuthState(newState);
      return;
    }
    this._token.set(null);
    this._expiresAt.set(null);
    try { localStorage.removeItem(AUTH_STATE_KEY); } catch {}
  }

  private readTokenFromStorage(): string | null {
    try {
      const state = this.readAuthState();
      if (state?.accessToken) {
        const exp = state.expiresAt ?? this.decodeExpiry(state.accessToken);
        if (exp && Date.now() >= exp) {
          this.clearState();
          return null;
        }
        return state.accessToken || null;
      }
      return null;
    } catch { return null; }
  }

  private readExpiryFromStorage(): number | null {
    try {
      const state = this.readAuthState();
      if (state?.expiresAt) return state.expiresAt;
      // Fallback on token's embedded expiry
      if (state?.accessToken) return this.decodeExpiry(state.accessToken) || null;
      return null;
    } catch {
      return null;
    }
  }

  private readAuthState(): AuthState | null {
    try {
      const raw = localStorage.getItem(AUTH_STATE_KEY);
      if (!raw) return null; // null if nothing stored
      const parsed: any = JSON.parse(raw); // string to json
      const sanitized: AuthState = {
        accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : '',
        refreshToken: !REFRESH_IN_COOKIE && parsed.refreshToken ? String(parsed.refreshToken) : undefined, // refresh if not in cookie mode
        expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : (parsed.expiresAt ? Number(parsed.expiresAt) : undefined),
      };
      if (!sanitized.accessToken) return null; // empty access token means logged out

      const sanitizedRaw = JSON.stringify(sanitized); // normalized back to string if changed
      if (sanitizedRaw !== raw) localStorage.setItem(AUTH_STATE_KEY, sanitizedRaw);
      return sanitized;
    } catch { return null; }
  }


  private persistAuthState(state: AuthState | null): void {
    try {
      // if state is present and has access token or (refresh token when not in cookie mode)
      if (state && (state.accessToken || (!REFRESH_IN_COOKIE && state.refreshToken))) {
        const access = state.accessToken || '';
        const toPersist: AuthState = REFRESH_IN_COOKIE ?
          { accessToken: access, expiresAt: state.expiresAt } : state; // full state if not cookie mode
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(toPersist));
        // signal updates
        this._token.set(access ? access : null);
        const exp = (state.expiresAt ?? (access ? this.decodeExpiry(access) : 0)) || null; // find out expiry
        this._expiresAt.set(exp);
      } else if (state && REFRESH_IN_COOKIE) {
        //  if cookie mode, we can store minimal state
        const access = state.accessToken || '';
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ accessToken: access, expiresAt: state.expiresAt }));
        this._token.set(access ? access : null);
        const exp = (state.expiresAt ?? (access ? this.decodeExpiry(access) : 0)) || null;
        this._expiresAt.set(exp);
      } else {
        localStorage.removeItem(AUTH_STATE_KEY);
        this._token.set(null);
        this._expiresAt.set(null);
      }
    } catch (e) {
      console.error('Failed to persist auth state', e);
    }
  }

  private decodeExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : 0;
    } catch {
      return 0;
    }
  }

  refreshToken(): Observable<void> {
    const state = this.readAuthState();
    const storedRefresh = REFRESH_IN_COOKIE ? undefined : state?.refreshToken;

    const callWithCookie = () => this.http
      .post<LoginResponseDTO>(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true })
      .pipe(tap(res => this.setLoginState(res)));

    const callWithBody = () => {
      if (!storedRefresh) return throwError(() => new Error('No refresh token'));
      return this.http.post<LoginResponseDTO>(`${this.baseUrl}/refresh-token`, { refreshToken: storedRefresh })
        .pipe(tap(res => this.setLoginState(res)));
    };

    if (REFRESH_IN_COOKIE) {
      return callWithCookie().pipe(map(() => void 0));
    }

    // If not cookie mode, try body-based refresh
    return callWithBody().pipe(
      catchError(() => {
        // As a fallback, attempt cookie-based refresh if server supports it
        return callWithCookie().pipe(map(() => void 0));
      }),
      map(() => void 0)
    );
  }

  getAuthority(): string | null {
    try {
      const token = this._token() || this.readAuthState()?.accessToken || null;
      if (!token) return null;
      const payloadRaw = token.split('.')[1] || '';
      const payload = JSON.parse(atob(payloadRaw)); // base64 decode to string and parse

      // Try various possible claim names and formats
      const candidate = (payload.role ?? payload.roles ?? payload.authorities) as any;
      let role: string | null = null;

      if (typeof candidate === 'string') {
        role = candidate;
      } else if (Array.isArray(candidate) && candidate.length > 0) {
        // array - take first element
        const first = candidate[0];
        if (typeof first === 'string') {
          role = first;
        } else if (first && typeof first === 'object') {
          // object with possible role fields
          role = String(first.role ?? first.authority ?? first.name ?? '');
        }
      } else if (candidate && typeof candidate === 'object') {
        // object with possible role fields
        role = String(candidate.role ?? candidate.authority ?? candidate.name ?? '');
      }

      if (role && role.startsWith('ROLE_')) role = role.substring(5);
      return role || null;
    } catch {
      return null;
    }
  }

  hasRole(role: 'STUDENT' | 'INSTRUCTOR' | string): boolean {
    const a = this.getAuthority();
    return (a ?? '').toUpperCase() === String(role).toUpperCase();
  }
}
