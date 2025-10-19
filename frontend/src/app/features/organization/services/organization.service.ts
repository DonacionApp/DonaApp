import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Organization {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  organizationType: string;
  description: string;
  taxId: string;
  supportDocumentUrl?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrganizationRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  organizationType: string;
  description: string;
  taxId: string;
  supportDocument: File | null;
}

export interface OrganizationLoginRequest {
  email: string;
  password: string;
}

export interface OrganizationResponse {
  success: boolean;
  message: string;
  data?: Organization;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly apiUrl = `${environment.apiUrl}/organizations`;
  private currentOrganizationSubject = new BehaviorSubject<Organization | null>(null);
  public currentOrganization$ = this.currentOrganizationSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar organización desde localStorage si existe
    this.loadOrganizationFromStorage();
  }

  /**
   * Registra una nueva organización
   */
  registerOrganization(organizationData: OrganizationRegisterRequest): Observable<OrganizationResponse> {
    const formData = new FormData();
    
    // Agregar todos los campos del formulario
    formData.append('name', organizationData.name);
    formData.append('email', organizationData.email);
    formData.append('password', organizationData.password);
    formData.append('phone', organizationData.phone);
    formData.append('address', organizationData.address);
    formData.append('city', organizationData.city);
    formData.append('country', organizationData.country);
    formData.append('organizationType', organizationData.organizationType);
    formData.append('description', organizationData.description);
    formData.append('taxId', organizationData.taxId);
    
    // Agregar archivo de soporte si existe
    if (organizationData.supportDocument) {
      formData.append('supportDocument', organizationData.supportDocument);
    }

    return this.http.post<OrganizationResponse>(`${this.apiUrl}/register`, formData)
      .pipe(
        tap(response => {
          if (response.success && response.data && response.token) {
            // Guardar token y datos de la organización
            localStorage.setItem('organization_token', response.token);
            localStorage.setItem('organization_data', JSON.stringify(response.data));
            this.currentOrganizationSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error registering organization:', error);
          throw error;
        })
      );
  }

  /**
   * Inicia sesión de una organización
   */
  loginOrganization(loginData: OrganizationLoginRequest): Observable<OrganizationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<OrganizationResponse>(`${this.apiUrl}/login`, loginData, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data && response.token) {
            // Guardar token y datos de la organización
            localStorage.setItem('organization_token', response.token);
            localStorage.setItem('organization_data', JSON.stringify(response.data));
            this.currentOrganizationSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error logging in organization:', error);
          throw error;
        })
      );
  }

  /**
   * Obtiene el perfil de la organización actual
   */
  getCurrentOrganizationProfile(): Observable<OrganizationResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<OrganizationResponse>(`${this.apiUrl}/profile`, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem('organization_data', JSON.stringify(response.data));
            this.currentOrganizationSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error getting organization profile:', error);
          throw error;
        })
      );
  }

  /**
   * Actualiza el perfil de la organización
   */
  updateOrganizationProfile(organizationData: Partial<Organization>): Observable<OrganizationResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<OrganizationResponse>(`${this.apiUrl}/profile`, organizationData, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem('organization_data', JSON.stringify(response.data));
            this.currentOrganizationSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('Error updating organization profile:', error);
          throw error;
        })
      );
  }

  /**
   * Cierra sesión de la organización
   */
  logout(): void {
    localStorage.removeItem('organization_token');
    localStorage.removeItem('organization_data');
    this.currentOrganizationSubject.next(null);
  }

  /**
   * Verifica si la organización está autenticada
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem('organization_token');
  }

  /**
   * Obtiene los datos de la organización actual
   */
  getCurrentOrganization(): Organization | null {
    return this.currentOrganizationSubject.value;
  }

  /**
   * Carga la organización desde localStorage
   */
  private loadOrganizationFromStorage(): void {
    const organizationData = localStorage.getItem('organization_data');
    if (organizationData) {
      try {
        const organization = JSON.parse(organizationData);
        this.currentOrganizationSubject.next(organization);
      } catch (error) {
        console.error('Error parsing organization data from storage:', error);
        localStorage.removeItem('organization_data');
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
   * Valida si el NIT/RUT ya está registrado
   */
  checkTaxIdAvailability(taxId: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.apiUrl}/check-tax-id/${taxId}`)
      .pipe(
        catchError(error => {
          console.error('Error checking tax ID availability:', error);
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
}
