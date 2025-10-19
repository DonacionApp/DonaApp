import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private router = inject(Router);

  onRegisterClick(): void {
    this.router.navigate(['/donor/register']);
  }

  onOrganizationRegisterClick(): void {
    this.router.navigate(['/organization/register']);
  }

  onLoginClick(): void {
    this.router.navigate(['/login']);
  }
}
