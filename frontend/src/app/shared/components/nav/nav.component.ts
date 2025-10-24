import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppStateService } from '../../../core/services/app-state.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './nav.component.html',
  styleUrls: []
})
export class NavComponent {
  isMobileMenuOpen = false;
  
  // Inyección de servicios
  private router = inject(Router);
  private appState = inject(AppStateService);
  
  // Acceso reactivo al estado
  isAuthenticated = this.appState.isAuthenticated;
  user = this.appState.user;
  currentView = this.appState.currentView;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onHomeClick(): void {
    this.closeMobileMenu();
    this.router.navigate(['/']);
  }

  onAboutClick(): void {
    this.closeMobileMenu();
    this.router.navigate(['/']);
  }

  onLoginClick(): void {
    this.closeMobileMenu();
    // Por ahora redirigir a la landing page, luego se implementará el login
    this.router.navigate(['/']);
  }

  onRegisterClick(): void {
    this.closeMobileMenu();
    // Redirigir directamente al registro de donantes
    this.router.navigate(['/donor/register']);
  }

  onOrganizationRegisterClick(): void {
    this.closeMobileMenu();
    // Redirigir directamente al registro de organizaciones
    this.router.navigate(['/organization/register']);
  }

  onLogoutClick(): void {
    this.closeMobileMenu();
    this.appState.logout();
    this.router.navigate(['/']);
  }

  // Cerrar menú móvil al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    
    if (this.isMobileMenuOpen && 
        !mobileMenu?.contains(target) && 
        !mobileMenuButton?.contains(target)) {
      this.closeMobileMenu();
    }
  }
}
