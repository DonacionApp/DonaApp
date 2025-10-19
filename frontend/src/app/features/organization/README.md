# Módulo de Organizaciones

Este módulo maneja toda la funcionalidad relacionada con las organizaciones en la aplicación DonaApp.

## Estructura del Módulo

```
organization/
├── components/
│   └── organization-register/
│       ├── organization-register.component.ts
│       ├── organization-register.component.html
│       └── organization-register.component.scss
├── services/
│   └── organization.service.ts
├── organization.module.ts
└── README.md
```

## Componentes

### OrganizationRegisterComponent

Componente standalone para el registro de nuevas organizaciones.

**Características:**
- Formulario reactivo con validaciones
- Validación de contraseñas coincidentes
- Validación de email y NIT/RUT únicos
- Interfaz responsive y moderna
- Integración con spinner de carga
- Manejo de errores y mensajes de éxito

**Campos del formulario:**
- Información básica: nombre, email, contraseña
- Información de contacto: teléfono, dirección, ciudad, país, sitio web
- Información de la organización: tipo, descripción, NIT/RUT
- Términos y condiciones

## Servicios

### OrganizationService

Servicio para manejar todas las operaciones relacionadas con organizaciones.

**Métodos principales:**
- `registerOrganization()`: Registra una nueva organización
- `loginOrganization()`: Inicia sesión de una organización
- `getCurrentOrganizationProfile()`: Obtiene el perfil actual
- `updateOrganizationProfile()`: Actualiza el perfil
- `logout()`: Cierra sesión
- `checkEmailAvailability()`: Verifica disponibilidad de email
- `checkTaxIdAvailability()`: Verifica disponibilidad de NIT/RUT
- `requestPasswordReset()`: Solicita restablecimiento de contraseña
- `resetPassword()`: Restablece la contraseña

## Rutas

- `/organization/register`: Página de registro de organizaciones

## Interfaces

### Organization
```typescript
interface Organization {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  organizationType: string;
  description: string;
  website?: string;
  taxId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### OrganizationRegisterRequest
```typescript
interface OrganizationRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  organizationType: string;
  description: string;
  website?: string;
  taxId: string;
}
```

## Uso

### Registro de Organización

```typescript
// En el componente
constructor(private organizationService: OrganizationService) {}

registerOrganization(data: OrganizationRegisterRequest) {
  this.organizationService.registerOrganization(data).subscribe({
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
this.organizationService.checkEmailAvailability(email).subscribe({
  next: (response) => {
    if (!response.available) {
      // Email ya está en uso
    }
  }
});

// Verificar NIT/RUT
this.organizationService.checkTaxIdAvailability(taxId).subscribe({
  next: (response) => {
    if (!response.available) {
      // NIT/RUT ya está en uso
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

## Validaciones

### Frontend
- Email válido
- Contraseña mínimo 6 caracteres
- Contraseñas coincidentes
- Teléfono formato válido
- Dirección mínimo 10 caracteres
- Descripción mínimo 20 caracteres
- NIT/RUT formato válido
- Sitio web formato URL válido
- Términos y condiciones aceptados

### Backend (pendiente de implementar)
- Email único en la base de datos
- NIT/RUT único en la base de datos
- Validación de tipos de organización
- Sanitización de datos

## Próximas Funcionalidades

- [ ] Dashboard de organización
- [ ] Perfil de organización
- [ ] Gestión de campañas
- [ ] Historial de donaciones recibidas
- [ ] Configuración de cuenta
- [ ] Notificaciones
- [ ] Reportes y estadísticas
