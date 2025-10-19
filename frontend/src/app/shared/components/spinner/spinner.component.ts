import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: false,
  template: `
    <div class="spinner-container" [class.overlay]="overlay">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
    </div>
  `,
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
  @Input() size: number = 40;
  @Input() message?: string;
  @Input() overlay: boolean = false;
}