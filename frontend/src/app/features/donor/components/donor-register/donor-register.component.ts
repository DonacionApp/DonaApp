import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DonorService } from '../../../donor/services/donor.service';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-donor-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SharedModule],
  providers: [DonorService],
  templateUrl: './donor-register.component.html'
})
export class DonorRegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentStep = 1;
  totalSteps = 3;
  selectedUserType: 'donor' | 'organization' | null = 'donor';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private donorService: DonorService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      dateOfBirth: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', [Validators.required]],
      country: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      profilePhoto: [null],
      acceptTerms: [false, [Validators.requiredTrue]],
      acceptNewsletter: [false]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Establecer valores por defecto
    this.registerForm.patchValue({
      country: 'Colombia'
    });
  }

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

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.registerForm.value;
      delete formData.confirmPassword; // No enviar confirmación de contraseña
      
      // Agregar tipoDNI automáticamente como Cédula de Ciudadanía (id: 2)
      formData.tipoDNI = { id: 2 };

      this.donorService.registerDonor(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.successMessage = '¡Registro exitoso! Redirigiendo...';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al registrar el donante. Inténtalo de nuevo.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['pattern']) {
        return `${this.getFieldLabel(fieldName)} tiene un formato inválido`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} debe ser mayor a ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Email',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      phone: 'Teléfono',
      dateOfBirth: 'Fecha de nacimiento',
      address: 'Dirección',
      city: 'Ciudad',
      country: 'País',
      postalCode: 'Código postal',
      dni: 'Documento de identidad',
      profilePhoto: 'Foto de perfil',
      acceptTerms: 'Términos y condiciones'
    };
    return labels[fieldName] || fieldName;
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onUserTypeChange(userType: 'donor' | 'organization'): void {
    this.selectedUserType = userType;
    
    // Si selecciona organización, redirigir al registro de organización
    if (userType === 'organization') {
      this.router.navigate(['/organization/register']);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Solo se permiten archivos JPG, JPEG y PNG';
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.errorMessage = 'El archivo no puede ser mayor a 5MB';
        return;
      }
      
      this.selectedFile = file;
      this.registerForm.patchValue({ profilePhoto: file });
      this.errorMessage = '';
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.registerForm.patchValue({ profilePhoto: null });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
