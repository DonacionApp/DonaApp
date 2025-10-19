import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Donor {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  identificationNumber: string;
  phone: string;
  dateOfBirth: Date;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  donationFrequency: string;
  maxDonationAmount: number;
  acceptNewsletter: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DonorRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  identificationNumber: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  donationFrequency: string;
  maxDonationAmount: number;
  acceptNewsletter: boolean;
}

export interface DonorLoginRequest {
  email: string;
  password: string;
}

export interface DonorResponse {
  success: boolean;
  message: string;
  data?: Donor;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DonorService {
  private readonly apiUrl = `${environment.apiUrl}/donors`;
  private currentDonorSubject = new BehaviorSubject<Donor | null>(null);
  public currentDonor$ = this.currentDonorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar donante desde localStorage si existe
    this.loadDonorFromStorage();
  }

  /**
   * Registra un nuevo donante
   */
  registerDonor(donorData: DonorRegisterRequest): Observable<DonorResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<DonorResponse>(`${this.apiUrl}/register`, donorData, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data && response.token) {
            // Guardar token y datos del donante
            localStorage.setItem('donor_token', response.token);
            localStorage.setItem('donor_data', JSON.stringify(response.data));
            this.currentDonorSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error registering donor:', error);
          throw error;
        })
      );
  }

  /**
   * Inicia sesión de un donante
   */
  loginDonor(loginData: DonorLoginRequest): Observable<DonorResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<DonorResponse>(`${this.apiUrl}/login`, loginData, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data && response.token) {
            // Guardar token y datos del donante
            localStorage.setItem('donor_token', response.token);
            localStorage.setItem('donor_data', JSON.stringify(response.data));
            this.currentDonorSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error logging in donor:', error);
          throw error;
        })
      );
  }

  /**
   * Obtiene el perfil del donante actual
   */
  getCurrentDonorProfile(): Observable<DonorResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<DonorResponse>(`${this.apiUrl}/profile`, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem('donor_data', JSON.stringify(response.data));
            this.currentDonorSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error getting donor profile:', error);
          throw error;
        })
      );
  }

  /**
   * Actualiza el perfil del donante
   */
  updateDonorProfile(donorData: Partial<Donor>): Observable<DonorResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<DonorResponse>(`${this.apiUrl}/profile`, donorData, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem('donor_data', JSON.stringify(response.data));
            this.currentDonorSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error updating donor profile:', error);
          throw error;
        })
      );
  }

  /**
   * Cierra sesión del donante
   */
  logout(): void {
    localStorage.removeItem('donor_token');
    localStorage.removeItem('donor_data');
    this.currentDonorSubject.next(null);
  }

  /**
   * Verifica si el donante está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem('donor_token');
  }

  /**
   * Obtiene los datos del donante actual
   */
  getCurrentDonor(): Donor | null {
    return this.currentDonorSubject.value;
  }

  /**
   * Carga el donante desde localStorage
   */
  private loadDonorFromStorage(): void {
    const donorData = localStorage.getItem('donor_data');
    if (donorData) {
      try {
        const donor = JSON.parse(donorData);
        this.currentDonorSubject.next(donor);
      } catch (error) {
        console.error('Error parsing donor data from storage:', error);
        localStorage.removeItem('donor_data');
      }
    }
  }

  /**
   * Valida si el email ya está registrado
   */
  checkEmailAvailability(email: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.apiUrl}/check-email/${email}`)
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
      `${this.apiUrl}/request-password-reset`, 
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
      `${this.apiUrl}/reset-password`, 
      { token, newPassword }, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error resetting password:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el historial de donaciones del donante
   */
  getDonationHistory(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/donations`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error getting donation history:', error);
          throw error;
        })
      );
  }

  /**
   * Realiza una nueva donación
   */
  makeDonation(donationData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.apiUrl}/donate`, donationData, { headers })
      .pipe(
        catchError(error => {
          console.error('Error making donation:', error);
          throw error;
        })
      );
  }
}
