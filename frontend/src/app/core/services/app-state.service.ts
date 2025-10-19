import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id?: string;
  email: string;
  name: string;
  type?: 'donor' | 'organization';
}

export type ViewType = 'home' | 'login' | 'register' | 'dashboard';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // Estado de la aplicación
  private currentViewSignal = signal<ViewType>('home');
  private isAuthenticatedSignal = signal<boolean>(false);
  private userSignal = signal<User | null>(null);

  // Computed signals para acceso reactivo
  currentView = computed(() => this.currentViewSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());
  user = computed(() => this.userSignal());

  // Computed signals para vistas específicas
  isHomeView = computed(() => this.currentViewSignal() === 'home');
  isLoginView = computed(() => this.currentViewSignal() === 'login');
  isRegisterView = computed(() => this.currentViewSignal() === 'register');
  isDashboardView = computed(() => this.currentViewSignal() === 'dashboard');

  // Métodos para cambiar de vista
  goToHome(): void {
    this.currentViewSignal.set('home');
  }

  goToLogin(): void {
    this.currentViewSignal.set('login');
  }

  goToRegister(): void {
    this.currentViewSignal.set('register');
  }

  goToDashboard(): void {
    this.currentViewSignal.set('dashboard');
  }

  // Métodos para autenticación
  setUser(user: User): void {
    this.userSignal.set(user);
    this.isAuthenticatedSignal.set(true);
  }

  logout(): void {
    this.userSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.goToHome();
  }

  // Método para verificar si el usuario está autenticado
  checkAuthStatus(): boolean {
    return this.isAuthenticatedSignal();
  }

  // Método para obtener el usuario actual
  getCurrentUser(): User | null {
    return this.userSignal();
  }
}
