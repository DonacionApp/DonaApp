import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  role: 'donor' | 'organization' | 'admin';
  name: string;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar si hay un usuario en localStorage al iniciar
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const loginData: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, loginData, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data && response.token) {
            // Guardar token y datos del usuario
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error during login:', error);
          throw error;
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Verifica si el token está expirado
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Refresca el token si es necesario
   */
  refreshToken(): Observable<LoginResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, {}, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            localStorage.setItem('auth_token', response.token);
          }
        }),
        catchError(error => {
          console.error('Error refreshing token:', error);
          this.logout(); // Si falla el refresh, hacer logout
          throw error;
        })
      );
  }

  /**
   * Verifica la disponibilidad del email
   */
  checkEmailAvailability(email: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${environment.apiUrl}/auth/check-email/${email}`)
      .pipe(
        catchError(error => {
          console.error('Error checking email availability:', error);
          throw error;
        })
      );
  }

  /**
   * Solicita restablecimiento de contraseña
   */
  requestPasswordReset(email: string): Observable<{ success: boolean; message: string }> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/auth/request-password-reset`, 
      { email }, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error requesting password reset:', error);
        throw error;
      })
    );
  }

  /**
   * Restablece la contraseña con el token
   */
  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/auth/reset-password`, 
      { token, newPassword }, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error resetting password:', error);
        throw error;
      })
    );
  }
}