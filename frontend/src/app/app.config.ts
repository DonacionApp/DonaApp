import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
// import { provideStore } from '@ngrx/store';
// import { provideEffects } from '@ngrx/effects';
// import { provideStoreDevtools } from '@ngrx/store-devtools';
// import { environment } from '../environments/environment';

// Store imports
// import { reducers, metaReducers } from './store/index';
// import { AuthEffects } from './store/auth/auth.effects';

const routes: Routes = [
  // Ruta para home
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'home', redirectTo: '/', pathMatch: 'full' },
  
  // Rutas específicas para cada tipo de registro
  { path: 'register/donor', loadComponent: () => import('./features/donor/components/donor-register/donor-register.component').then(m => m.DonorRegisterComponent) },
  { path: 'register/organization', loadComponent: () => import('./features/organization/components/organization-register/organization-register.component').then(m => m.OrganizationRegisterComponent) },
  
  // Ruta de registro general - redirigir a donante por defecto
  { path: 'register', redirectTo: '/register/donor', pathMatch: 'full' },
  { path: 'organization/register', redirectTo: '/register/organization', pathMatch: 'full' },
  { path: 'donor/register', redirectTo: '/register/donor', pathMatch: 'full' },
  
  // Lazy loading para otros módulos de feature
  {
    path: 'organization',
    loadChildren: () => import('./features/organization/organization.module').then(m => m.OrganizationModule)
  },
  {
    path: 'donor',
    loadChildren: () => import('./features/donor/donor.module').then(m => m.DonorModule)
  },
  
  // Ruta por defecto - redirigir a home
  { path: '', redirectTo: '/', pathMatch: 'full' },
  
  // Ruta wildcard para 404 - redirigir a home
  { path: '**', redirectTo: '/' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
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
