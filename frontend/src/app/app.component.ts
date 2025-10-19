import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { filter } from 'rxjs/operators';
import { AppStateService } from './core/services/app-state.service';
import { RegistrationStateService } from './core/services/registration-state.service';
import { NavComponent } from './shared/components/nav/nav.component';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavComponent],
  providers: [HttpClient],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'DonacionApp';
  
  // Inyección de servicios de estado
  appState = inject(AppStateService);
  registrationState = inject(RegistrationStateService);
  
  // Acceso reactivo al estado de la aplicación
  currentView = this.appState.currentView;
  isHomeView = this.appState.isHomeView;
  isRegisterView = this.appState.isRegisterView;
  isLoginView = this.appState.isLoginView;
  isDashboardView = this.appState.isDashboardView;
  isAuthenticated = this.appState.isAuthenticated;
  user = this.appState.user;


  // Datos del formulario de login
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  // Estado del login
  isLoginLoading = false;
  loginErrorMessage = '';
  loginSuccessMessage = '';
  showLoginPassword = false;

  // Estado del registro
  showPassword = false;
  showConfirmPassword = false;

  // Getters para el login (para usar en el template)
  getIsLoginLoading() { return this.isLoginLoading; }
  getLoginErrorMessage() { return this.loginErrorMessage; }
  getLoginSuccessMessage() { return this.loginSuccessMessage; }
  getShowLoginPassword() { return this.showLoginPassword; }

  // Getters para el registro
  formData = this.registrationState.formData;
  isOrganizationSelected = this.registrationState.isOrganizationSelected;
  selectedUserType = this.registrationState.selectedType;


  constructor(
    public router: Router,
    private http: HttpClient
  ) {}

      ngOnInit(): void {
        // Inicialización básica
      }



  // Métodos para el login
  toggleLoginPassword(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  clearLoginMessages(): void {
    this.loginErrorMessage = '';
    this.loginSuccessMessage = '';
  }


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  clearMessages(): void {
    this.registrationState.clearMessages();
  }

  validateForm(): boolean {
    const data = this.formData();
    
    if (!data.email || !data.password || !data.phone || !data.address) {
      this.registrationState.setErrorMessage('Por favor completa todos los campos obligatorios');
      return false;
    }

    if (data.password !== data.confirmPassword) {
      this.registrationState.setErrorMessage('Las contraseñas no coinciden');
      return false;
    }

    if (data.password.length < 6) {
      this.registrationState.setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!this.registrationState.selectedType()) {
      this.registrationState.setErrorMessage('Por favor selecciona un tipo de usuario');
      return false;
    }

    // Validaciones específicas por tipo
    if (this.registrationState.selectedType() === 'donor') {
      if (!data.firstName || !data.lastName || !data.identificationNumber || !data.dateOfBirth || !data.city || !data.country) {
        this.registrationState.setErrorMessage('Por favor completa todos los campos obligatorios para donante');
        return false;
      }
    } else if (this.registrationState.selectedType() === 'organization') {
      if (!data.organizationName || !data.description || !data.organizationType || !data.taxId) {
        this.registrationState.setErrorMessage('Por favor completa todos los campos obligatorios para organización');
        return false;
      }
    }

    if (!data.acceptTerms) {
      this.registrationState.setErrorMessage('Debes aceptar los términos y condiciones');
      return false;
    }

    return true;
  }

  async onRegisterSubmit(): Promise<void> {
    this.clearMessages();
    
    if (!this.validateForm()) {
      return;
    }

    this.registrationState.setLoading(true);

    try {
      if (this.registrationState.selectedType() === 'donor') {
        await this.registerDonor();
      } else {
        await this.registerOrganization();
      }
    } catch (error) {
      this.registrationState.setErrorMessage('Error al procesar el registro. Inténtalo de nuevo.');
    } finally {
      this.registrationState.setLoading(false);
    }
  }

  async registerDonor(): Promise<void> {
    const data = this.formData();
    
    const donorData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      identificationNumber: data.identificationNumber,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      city: data.city,
      country: data.country,
      postalCode: data.postalCode,
      donationFrequency: data.donationFrequency,
      maxDonationAmount: data.maxDonationAmount,
      acceptNewsletter: data.acceptNewsletter
    };

    const response = await this.http.post<ApiResponse>(`${environment.apiUrl}/donors/register`, donorData).toPromise();
    
    if (response?.success) {
      this.registrationState.setSuccessMessage('¡Registro exitoso! Tu cuenta de donante ha sido creada.');
      // Reset form
      this.registrationState.resetForm();
    } else {
      this.registrationState.setErrorMessage(response?.message || 'Error al registrar donante');
    }
  }

  async registerOrganization(): Promise<void> {
    const data = this.formData();
    
    const organizationData = {
      name: data.organizationName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      address: data.address,
      description: data.description,
      organizationType: data.organizationType,
      taxId: data.taxId
    };

    const response = await this.http.post<ApiResponse>(`${environment.apiUrl}/organizations/register`, organizationData).toPromise();
    
    if (response?.success) {
      this.registrationState.setSuccessMessage('¡Registro exitoso! Tu organización ha sido registrada.');
      // Reset form
      this.registrationState.resetForm();
    } else {
      this.registrationState.setErrorMessage(response?.message || 'Error al registrar organización');
    }
  }

  async onLoginSubmit(): Promise<void> {
    this.clearLoginMessages();
    
    if (!this.loginData.email || !this.loginData.password) {
      this.loginErrorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoginLoading = true;

    try {
      // Aquí harías la llamada al backend para autenticar
      const loginRequest = {
        email: this.loginData.email,
        password: this.loginData.password,
        rememberMe: this.loginData.rememberMe
      };

      // Simulación de login (reemplazar con llamada real al backend)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular éxito de login
      this.loginSuccessMessage = '¡Inicio de sesión exitoso!';
      this.appState.setUser({ email: this.loginData.email, name: 'Usuario' });
      this.appState.goToDashboard();
      
      // Limpiar formulario
      this.loginData = { email: '', password: '', rememberMe: false };
      
    } catch (error) {
      this.loginErrorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
    } finally {
      this.isLoginLoading = false;
    }
  }


  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

}
