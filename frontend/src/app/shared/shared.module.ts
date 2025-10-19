import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './components/spinner/spinner.component';

/**
 * SharedModule contiene componentes, directivas y pipes reutilizables
 * Se importa en los módulos de features que lo necesiten
 */
@NgModule({
  declarations: [
    SpinnerComponent
    // Aquí irán más componentes, directivas y pipes compartidos
  ],
  imports: [
    CommonModule
    // Aquí se pueden importar otros módulos compartidos como Material
  ],
  exports: [
    SpinnerComponent
    // Exportar todo lo que necesiten usar otros módulos
  ]
})
export class SharedModule { }