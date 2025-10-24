import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FooterComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private router = inject(Router);

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onDonorRegisterClick(): void {
    this.router.navigate(['/donor/register']);
  }

  onOrganizationRegisterClick(): void {
    this.router.navigate(['/organization/register']);
  }
}
