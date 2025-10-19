# Módulo de Donantes

Este módulo maneja toda la funcionalidad relacionada con los donantes en la aplicación DonaApp.

## Estructura del Módulo

```
donor/
├── components/
│   └── donor-register/
│       ├── donor-register.component.ts
│       └── donor-register.component.html
├── services/
│   └── donor.service.ts
├── donor.module.ts
└── README.md
```

## Componentes

### DonorRegisterComponent

Componente standalone para el registro de nuevos donantes con formulario multi-paso.

**Características:**
- **Formulario multi-paso** (3 pasos) con validaciones
- **Manejo de estados** completo con interface DonorRegisterState
- **Validación de contraseñas** coincidentes
- **Interfaz responsive** y moderna con Tailwind CSS
- **Integración con spinner** de carga
- **Manejo de errores** y mensajes de éxito
- **Barra de progreso** visual

**Pasos del formulario:**
1. **Información Personal**: Nombre, apellido, email, contraseña, teléfono, fecha de nacimiento
2. **Información de Contacto**: Dirección, ciudad, país, código postal
3. **Preferencias de Donación**: Frecuencia, monto máximo, términos y condiciones

## Servicios

### DonorService

Servicio para manejar todas las operaciones relacionadas con donantes.

**Métodos principales:**
- `registerDonor()`: Registra un nuevo donante
- `loginDonor()`: Inicia sesión de un donante
- `getCurrentDonorProfile()`: Obtiene el perfil actual
- `updateDonorProfile()`: Actualiza el perfil
- `logout()`: Cierra sesión
- `checkEmailAvailability()`: Verifica disponibilidad de email
- `requestPasswordReset()`: Solicita restablecimiento de contraseña
- `resetPassword()`: Restablece la contraseña
- `getDonationHistory()`: Obtiene historial de donaciones
- `makeDonation()`: Realiza una nueva donación

## Manejo de Estados

### DonorRegisterState Interface
```typescript
interface DonorRegisterState {
  isLoading: boolean;
  errorMessage: string;
  successMessage: string;
  currentStep: number;
  totalSteps: number;
}
```

**Estados manejados:**
- **Loading**: Estado de carga durante operaciones
- **Error**: Mensajes de error con validaciones
- **Success**: Mensajes de éxito
- **Navigation**: Control de pasos del formulario
- **Progress**: Barra de progreso visual

## Rutas

- `/donor/register`: Página de registro de donantes

## Interfaces

### Donor
```typescript
interface Donor {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
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
```

### DonorRegisterRequest
```typescript
interface DonorRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
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
```

## Validaciones

### Frontend
- **Información Personal**:
  - Nombre y apellido: mínimo 2 caracteres
  - Email: formato válido
  - Contraseña: mínimo 6 caracteres
  - Contraseñas coincidentes
  - Teléfono: formato válido
  - Fecha de nacimiento: requerida

- **Información de Contacto**:
  - Dirección: mínimo 10 caracteres
  - Ciudad, país, código postal: requeridos

- **Preferencias de Donación**:
  - Frecuencia: requerida
  - Monto máximo: mayor a 1
  - Términos y condiciones: aceptados

### Backend (pendiente de implementar)
- Email único en la base de datos
- Validación de edad mínima
- Sanitización de datos

## Uso

### Registro de Donante

```typescript
// En el componente
constructor(private donorService: DonorService) {}

registerDonor(data: DonorRegisterRequest) {
  this.donorService.registerDonor(data).subscribe({
    next: (response) => {
      // Manejar éxito
    },
    error: (error) => {
      // Manejar error
    }
  });
}
```

### Verificación de Disponibilidad

```typescript
// Verificar email
this.donorService.checkEmailAvailability(email).subscribe({
  next: (response) => {
    if (!response.available) {
      // Email ya está en uso
    }
  }
});
```

## Configuración

El servicio utiliza la configuración de environment para la URL de la API:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

## Características del Formulario Multi-Paso

### Navegación
- **Botón "Siguiente"**: Valida el paso actual antes de avanzar
- **Botón "Anterior"**: Regresa al paso anterior
- **Botón "Cancelar"**: En el primer paso, regresa al login
- **Validación por pasos**: Cada paso valida sus campos específicos

### UX/UI
- **Barra de progreso**: Muestra el avance visual
- **Estados de carga**: Spinner durante el registro
- **Mensajes contextuales**: Error y éxito específicos
- **Validación en tiempo real**: Campos marcados como inválidos
- **Responsive design**: Funciona en móviles y desktop

## Próximas Funcionalidades

- [ ] Dashboard de donante
- [ ] Perfil de donante
- [ ] Historial de donaciones
- [ ] Realizar donaciones
- [ ] Configuración de cuenta
- [ ] Notificaciones
- [ ] Reportes de impacto
