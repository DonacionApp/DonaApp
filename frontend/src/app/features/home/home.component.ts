import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {

  constructor(private router: Router) {}

  onRegisterClick(): void {
    this.router.navigate(['/register/donor']);
  }

  onLoginClick(): void {
    // Implementar navegación a login
    console.log('Navigate to login');
  }
}
