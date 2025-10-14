import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'DonaApp';

  constructor(private router: Router) {}

  goToOrganizationRegister(): void {
    this.router.navigate(['/organization/register']);
  }

  goToDonorRegister(): void {
    this.router.navigate(['/donor/register']);
  }
}
