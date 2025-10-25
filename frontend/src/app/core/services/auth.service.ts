import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, Subject } from 'rxjs';
import { map, tap, filter, take, finalize } from 'rxjs/operators';

export type UserRole = 'donor' | 'organization' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface BackendLoginResponse {
  message?: string;
  access_token: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  lastAccess?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000';
  private readonly storageKey = 'donaapp::auth-session';
  private readonly storage = typeof window !== 'undefined' ? window.localStorage : null;

  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);
  readonly session$ = this.sessionSubject.asObservable();

  private readonly refreshTokenSubject = new Subject<string | null>();
  private isRefreshing = false;

  constructor(private http: HttpClient) {
    const storedSession = this.readStoredSession();
    if (storedSession) {
      this.sessionSubject.next(storedSession);
    }
  }

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http.post<BackendLoginResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      map(response => this.persistSessionFromToken(response.access_token))
    );
  }

  logout(): void {
    this.clearStoredSession();
    this.sessionSubject.next(null);
  }

  get currentUserValue(): User | null {
    return this.sessionSubject.value?.user ?? null;
  }

  get currentSessionValue(): AuthSession | null {
    return this.sessionSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.sessionSubject.value?.accessToken;
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }

  getAccessToken(): string | null {
    return this.sessionSubject.value?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.sessionSubject.value?.refreshToken ?? null;
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No hay token de actualización disponible'));
    }

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1)
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    // Si el backend implementa refresh, adaptar aquí; por ahora mantenemos la forma pero
    // la respuesta esperada debería incluir un nuevo access_token.
    return this.http.post<BackendLoginResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      map(response => {
        const session = this.persistSessionFromToken(response.access_token);
        const token = session.accessToken;
        return token;
      }),
      tap(token => this.refreshTokenSubject.next(token)),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  updateLastAccess(dateIso?: string): void {
    const session = this.sessionSubject.value;
    if (!session) {
      return;
    }

    const updated: AuthSession = {
      ...session,
      lastAccess: dateIso ?? new Date().toISOString()
    };

    this.writeStoredSession(updated);
    this.sessionSubject.next(updated);
  }

  /** Crea y persiste la sesión a partir de un JWT (access token). */
  private persistSessionFromToken(accessToken: string): AuthSession {
    const claims = this.decodeJwt(accessToken) ?? {};

    const user: User = {
      id: claims.sub ? String(claims.sub) : '',
      email: claims.email ?? '',
      role: (claims.rol ?? 'donor') as UserRole,
      name: claims.userName ?? ''
    };

    const session: AuthSession = {
      user,
      accessToken,
      refreshToken: undefined,
      // No tenemos lastAccess real desde el backend en la respuesta; usamos ahora.
      lastAccess: new Date().toISOString()
    };

    this.writeStoredSession(session);
    this.sessionSubject.next(session);
    return session;
  }

  /** Decodifica las claims del JWT sin validar la firma (solo lectura del payload). */
  private decodeJwt(token: string): any | null {
    if (!token) {
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      // base64url -> base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // Pad base64 string
      const pad = base64.length % 4;
      const padded = base64 + (pad === 2 ? '==' : pad === 3 ? '=' : pad === 1 ? '===' : '');
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private readStoredSession(): AuthSession | null {
    if (!this.storage) {
      return null;
    }

    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as AuthSession;
    } catch {
      this.storage.removeItem(this.storageKey);
      return null;
    }
  }

  private writeStoredSession(session: AuthSession): void {
    if (!this.storage) {
      return;
    }

    this.storage.setItem(this.storageKey, JSON.stringify(session));
  }

  private clearStoredSession(): void {
    if (!this.storage) {
      return;
    }

    this.storage.removeItem(this.storageKey);
  }
}