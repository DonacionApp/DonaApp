import { Injectable, signal, computed } from '@angular/core';

export interface RegistrationFormData {
  // Datos personales
  firstName: string;
  lastName: string;
  identificationNumber: string;
  dateOfBirth: string;
  city: string;
  country: string;
  postalCode: string;
  
  // Datos de contacto
  email: string;
  phone: string;
  address: string;
  
  // Datos de autenticación
  password: string;
  confirmPassword: string;
  
  // Datos de organización (solo para organizaciones)
  organizationName: string;
  description: string;
  organizationType: string;
  taxId: string;
  
  // Preferencias
  donationFrequency: string;
  maxDonationAmount: number;
  acceptNewsletter: boolean;
  acceptTerms: boolean;
}

export interface RegistrationState {
  selectedType: 'donor' | 'organization' | null;
  formData: RegistrationFormData;
  isLoading: boolean;
  errorMessage: string;
  successMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationStateService {
  // Estado del registro
  private state = signal<RegistrationState>({
    selectedType: 'donor',
    formData: {
      firstName: '',
      lastName: '',
      identificationNumber: '',
      dateOfBirth: '',
      city: 'Colombia',
      country: 'Colombia',
      postalCode: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
      description: '',
      organizationType: '',
      taxId: '',
      donationFrequency: 'monthly',
      maxDonationAmount: 100,
      acceptNewsletter: false,
      acceptTerms: false
    },
    isLoading: false,
    errorMessage: '',
    successMessage: ''
  });

  // Computed signals para acceso reactivo
  selectedType = computed(() => this.state().selectedType);
  formData = computed(() => this.state().formData);
  isLoading = computed(() => this.state().isLoading);
  errorMessage = computed(() => this.state().errorMessage);
  successMessage = computed(() => this.state().successMessage);

  // Computed para verificar si es organización
  isOrganizationSelected = computed(() => this.state().selectedType === 'organization');

  // Métodos para actualizar el estado
  setSelectedType(type: 'donor' | 'organization' | null): void {
    this.state.update(current => ({
      ...current,
      selectedType: type,
      errorMessage: '',
      successMessage: ''
    }));
  }

  updateFormData(updates: Partial<RegistrationFormData>): void {
    this.state.update(current => ({
      ...current,
      formData: { ...current.formData, ...updates }
    }));
  }

  setLoading(loading: boolean): void {
    this.state.update(current => ({
      ...current,
      isLoading: loading
    }));
  }

  setErrorMessage(message: string): void {
    this.state.update(current => ({
      ...current,
      errorMessage: message,
      successMessage: ''
    }));
  }

  setSuccessMessage(message: string): void {
    this.state.update(current => ({
      ...current,
      successMessage: message,
      errorMessage: ''
    }));
  }

  clearMessages(): void {
    this.state.update(current => ({
      ...current,
      errorMessage: '',
      successMessage: ''
    }));
  }

  resetForm(): void {
    this.state.set({
      selectedType: 'donor',
      formData: {
        firstName: '',
        lastName: '',
        identificationNumber: '',
        dateOfBirth: '',
        city: 'Colombia',
        country: 'Colombia',
        postalCode: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        organizationName: '',
        description: '',
        organizationType: '',
        taxId: '',
        donationFrequency: 'monthly',
        maxDonationAmount: 100,
        acceptNewsletter: false,
        acceptTerms: false
      },
      isLoading: false,
      errorMessage: '',
      successMessage: ''
    });
  }
}
