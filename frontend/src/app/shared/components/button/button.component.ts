import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'disabled';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() fullWidth: boolean = false;
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  
  @Output() btnClick = new EventEmitter<Event>();

  get buttonClasses(): string {
    const baseClasses = 'font-medium transition-colors rounded-lg';
    
    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-orange-500 hover:bg-orange-600 text-white',
      secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
      ghost: 'text-gray-700 hover:text-green-600',
      disabled: 'bg-orange-500 text-white cursor-not-allowed opacity-75'
    };
    
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-8 py-3 text-base'
    };
    
    const widthClass = this.fullWidth ? 'w-full' : '';
    
    const variant = this.disabled ? 'disabled' : this.variant;
    
    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[this.size]} ${widthClass}`.trim();
  }

  onClick(event: Event): void {
    if (!this.disabled) {
      this.btnClick.emit(event);
    }
  }
}

