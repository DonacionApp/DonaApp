import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrganizationService, OrganizationRegisterRequest } from '../../services/organization.service';
import { SharedModule } from '../../../../shared/shared.module';
import { RegistrationStateService } from '../../../../core/services/registration-state.service';

interface OrganizationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  organizationType: string;
  description: string;
  taxId: string;
  supportDocument: File | null;
  acceptTerms: boolean;
}

@Component({
  selector: 'app-organization-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SharedModule],
  providers: [OrganizationService],
  templateUrl: './organization-register.component.html'
})
export class OrganizationRegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showSuccessScreen = false;
  emailChecking = false;
  taxIdChecking = false;
  selectedFile: File | null = null;

  // Inyección del servicio de estado de registro
  private registrationState = inject(RegistrationStateService);

  // Constantes para validaciones
  private readonly VALIDATION_RULES = {
    MIN_PASSWORD_LENGTH: 6,
    MIN_NAME_LENGTH: 3,
    MIN_ADDRESS_LENGTH: 10,
    MIN_DESCRIPTION_LENGTH: 20
  };

  // Opciones para el tipo de organización
  readonly ORGANIZATION_TYPES = [
    { value: 'fundacion', label: 'Fundación' },
    { value: 'ong', label: 'ONG' },
    { value: 'asociacion', label: 'Asociación' },
    { value: 'corporacion', label: 'Corporación' },
    { value: 'cooperativa', label: 'Cooperativa' },
    { value: 'iglesia', label: 'Iglesia' },
    { value: 'otro', label: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(this.VALIDATION_RULES.MIN_NAME_LENGTH)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(this.VALIDATION_RULES.MIN_PASSWORD_LENGTH)
      ]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [
        Validators.required, 
        Validators.pattern(/^[0-9+\-\s()]+$/)
      ]],
      address: ['', [
        Validators.required, 
        Validators.minLength(this.VALIDATION_RULES.MIN_ADDRESS_LENGTH)
      ]],
      city: ['', [Validators.required]],
      country: ['', [Validators.required]],
      organizationType: ['', [Validators.required]],
      description: ['', [
        Validators.required, 
        Validators.minLength(this.VALIDATION_RULES.MIN_DESCRIPTION_LENGTH)
      ]],
      supportDocument: [null, [Validators.required]],
      taxId: ['', [
        Validators.required, 
        Validators.pattern(/^[A-Z0-9]+$/)
      ]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Configurar validación en tiempo real para email
    this.registerForm.get('email')?.valueChanges.subscribe(email => {
      if (email && this.registerForm.get('email')?.valid) {
        this.checkEmailAvailability(email);
      }
    });

    // Configurar validación en tiempo real para NIT
    this.registerForm.get('taxId')?.valueChanges.subscribe(taxId => {
      if (taxId && this.registerForm.get('taxId')?.valid) {
        this.checkTaxIdAvailability(taxId);
      }
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  /**
   * Maneja el envío del formulario de registro
   */
  onSubmit(): void {
    if (this.registerForm.valid) {
      this.handleFormSubmission();
    } else {
      this.markFormGroupTouched();
      this.showValidationErrors();
    }
  }

  /**
   * Procesa el envío del formulario
   */
  private handleFormSubmission(): void {
    this.setLoadingState(true);
    this.clearMessages();

    const formData = this.prepareFormData();
    
    this.organizationService.registerOrganization(formData).subscribe({
      next: (response) => this.handleRegistrationSuccess(response),
      error: (error) => this.handleRegistrationError(error)
    });
  }

  /**
   * Prepara los datos del formulario para el envío
   */
  private prepareFormData(): OrganizationRegisterRequest {
    const formData = { ...this.registerForm.value };
    // Remover campos que no se envían al backend
    delete formData.confirmPassword;
    delete formData.acceptTerms;
    
    // Asegurar que todos los campos requeridos estén presentes
    return {
      name: formData.name || '',
      email: formData.email || '',
      password: formData.password || '',
      phone: formData.phone || '',
      address: formData.address || '',
      city: formData.city || '',
      country: formData.country || '',
      organizationType: formData.organizationType || '',
      description: formData.description || '',
      taxId: formData.taxId || '',
      supportDocument: this.selectedFile
    };
  }

  /**
   * Maneja el éxito del registro
   */
  private handleRegistrationSuccess(response: any): void {
    this.setLoadingState(false);
    this.showSuccessScreen = true;
    this.successMessage = 'Organización registrada exitosamente.';
  }

  /**
   * Maneja los errores del registro
   */
  private handleRegistrationError(error: any): void {
    this.setLoadingState(false);
    console.error('Registration error:', error);
    
    // Manejar diferentes tipos de errores
    if (error.status === 400) {
      this.errorMessage = error.error?.message || 'Datos inválidos. Por favor, revisa la información ingresada.';
    } else if (error.status === 409) {
      this.errorMessage = 'El email o NIT ya está registrado. Por favor, usa otros datos.';
    } else if (error.status === 500) {
      this.errorMessage = 'Error del servidor. Por favor, inténtalo más tarde.';
    } else if (error.status === 0) {
      this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } else {
      this.errorMessage = error.error?.message || 'Error al registrar la organización. Inténtalo de nuevo.';
    }
  }

  /**
   * Establece el estado de carga
   */
  private setLoadingState(loading: boolean): void {
    this.isLoading = loading;
  }

  /**
   * Limpia los mensajes de error y éxito
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Muestra errores de validación si el formulario es inválido
   */
  private showValidationErrors(): void {
    this.errorMessage = 'Por favor, corrige los errores en el formulario antes de continuar.';
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      return this.getErrorMessage(fieldName, field.errors);
    }
    return '';
  }

  /**
   * Genera el mensaje de error basado en el tipo de error
   */
  private getErrorMessage(fieldName: string, errors: any): string {
    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (errors['email']) {
      return 'Email inválido';
    }
    if (errors['emailTaken']) {
      return 'Este email ya está registrado';
    }
    if (errors['taxIdTaken']) {
      return 'Este NIT ya está registrado';
    }
    if (errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    }
    if (errors['pattern']) {
      return this.getPatternErrorMessage(fieldName);
    }
    if (errors['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    if (errors['fileTooLarge']) {
      return 'El archivo es demasiado grande. Máximo 10MB';
    }
    if (errors['invalidFileType']) {
      return 'Tipo de archivo no válido. Solo se permiten PDF, JPG, PNG, DOC, DOCX';
    }
    return 'Campo inválido';
  }

  /**
   * Obtiene mensajes de error específicos para campos con patrón
   */
  private getPatternErrorMessage(fieldName: string): string {
    const patternMessages: { [key: string]: string } = {
      phone: 'Formato de teléfono inválido',
      taxId: 'NIT inválido (solo letras mayúsculas y números)'
    };
    return patternMessages[fieldName] || `${this.getFieldLabel(fieldName)} tiene un formato inválido`;
  }

  /**
   * Obtiene la etiqueta legible para un campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nombre de la organización',
      email: 'Email',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      phone: 'Teléfono',
      address: 'Dirección',
      city: 'Ciudad',
      country: 'País',
      organizationType: 'Tipo de organización',
      description: 'Descripción',
      taxId: 'NIT',
      supportDocument: 'Documento de soporte'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Navega a la página de login
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navega a la página de login desde la pantalla de éxito
   */
  goToLoginFromSuccess(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Regresa al formulario de registro desde la pantalla de éxito
   */
  backToRegistration(): void {
    this.showSuccessScreen = false;
    this.clearMessages();
    this.registerForm.reset();
  }

  /**
   * Verifica la disponibilidad del email
   */
  private checkEmailAvailability(email: string): void {
    this.emailChecking = true;
    this.organizationService.checkEmailAvailability(email).subscribe({
      next: (response) => {
        this.emailChecking = false;
        if (!response.available) {
          this.registerForm.get('email')?.setErrors({ emailTaken: true });
        }
      },
      error: (error) => {
        this.emailChecking = false;
        console.error('Error checking email availability:', error);
      }
    });
  }

  /**
   * Verifica la disponibilidad del NIT
   */
  private checkTaxIdAvailability(taxId: string): void {
    this.taxIdChecking = true;
    this.organizationService.checkTaxIdAvailability(taxId).subscribe({
      next: (response) => {
        this.taxIdChecking = false;
        if (!response.available) {
          this.registerForm.get('taxId')?.setErrors({ taxIdTaken: true });
        }
      },
      error: (error) => {
        this.taxIdChecking = false;
        console.error('Error checking tax ID availability:', error);
      }
    });
  }

  /**
   * Verifica si un campo tiene errores
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Verifica si un campo es válido
   */
  isFieldValid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.valid && field.touched);
  }

  /**
   * Obtiene las clases CSS para un campo basado en su estado
   */
  getFieldClasses(fieldName: string): string {
    const baseClasses = 'w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200';
    
    if (this.hasFieldError(fieldName)) {
      return `${baseClasses} border-red-500 ring-red-500`;
    }
    
    if (this.isFieldValid(fieldName)) {
      return `${baseClasses} border-green-500 ring-green-500`;
    }
    
    return `${baseClasses} border-gray-300 focus:ring-green-500`;
  }

  /**
   * Maneja la selección de archivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño del archivo (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.registerForm.get('supportDocument')?.setErrors({ fileTooLarge: true });
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.registerForm.get('supportDocument')?.setErrors({ invalidFileType: true });
        return;
      }

      this.selectedFile = file;
      this.registerForm.get('supportDocument')?.setValue(file);
      this.registerForm.get('supportDocument')?.setErrors(null);
    }
  }

  /**
   * Elimina el archivo seleccionado
   */
  removeFile(): void {
    this.selectedFile = null;
    this.registerForm.get('supportDocument')?.setValue(null);
    this.registerForm.get('supportDocument')?.setErrors({ required: true });
  }

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Regresa al selector de tipo de usuario
   */
  goBackToUserTypeSelection(): void {
    // Navegar de vuelta al selector principal
    this.router.navigate(['/']);
  }

  /**
   * Cambia el tipo de usuario seleccionado
   */
  onUserTypeChange(type: 'donor' | 'organization'): void {
    // Navegar a la ruta específica del tipo de usuario
    if (type === 'donor') {
      this.router.navigate(['/register/donor']);
    } else {
      this.router.navigate(['/register/organization']);
    }
  }
}
