import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html'
})
export class NavComponent {
  isMobileMenuOpen = false;

  constructor(private router: Router) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onRegisterClick(): void {
    this.closeMobileMenu();
    this.router.navigate(['/register/donor']);
  }

  onLoginClick(): void {
    this.closeMobileMenu();
    // Tu compañero implementará la lógica de login aquí
    console.log('Navigate to login');
  }

  onAboutClick(): void {
    this.closeMobileMenu();
    // Navegar a página de acerca de
    console.log('Navigate to about');
  }
}
