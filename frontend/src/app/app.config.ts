import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
// import { provideStore } from '@ngrx/store';
// import { provideEffects } from '@ngrx/effects';
// import { provideStoreDevtools } from '@ngrx/store-devtools';
// import { environment } from '../environments/environment';

// Store imports
// import { reducers, metaReducers } from './store/index';
// import { AuthEffects } from './store/auth/auth.effects';

const routes: Routes = [
  // Ruta principal - Landing Page
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  
  // Rutas directas para login y register
  {
    path: 'login',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'register',
    redirectTo: '/donor/register'
  },
  
  // Rutas específicas para cada tipo de registro
  { path: 'donor/register', loadComponent: () => import('./features/donor/components/donor-register/donor-register.component').then(m => m.DonorRegisterComponent) },
  { path: 'organization/register', loadComponent: () => import('./features/organization/components/organization-register/organization-register.component').then(m => m.OrganizationRegisterComponent) },
  
  // Rutas de registro alternativas
  { path: 'register/donor', redirectTo: '/donor/register', pathMatch: 'full' },
  { path: 'register/organization', redirectTo: '/organization/register', pathMatch: 'full' },
  
  // Lazy loading para otros módulos de feature
  {
    path: 'organization',
    loadChildren: () => import('./features/organization/organization.module').then(m => m.OrganizationModule)
  },
  {
    path: 'donor',
    loadChildren: () => import('./features/donor/donor.module').then(m => m.DonorModule)
  },
  
  // Ruta wildcard para 404 - redirigir a home
  { path: '**', redirectTo: '' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    },
    // provideStore(reducers, { metaReducers }),
    // provideEffects([AuthEffects]),
    // provideStoreDevtools({
    //   maxAge: 25,
    //   logOnly: environment.production,
    //   autoPause: true,
    // }),
    importProvidersFrom(BrowserModule)
  ]
};
