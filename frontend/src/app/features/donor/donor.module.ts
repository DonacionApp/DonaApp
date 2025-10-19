import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DonorRegisterComponent } from './components/donor-register/donor-register.component';

const routes: Routes = [
  { path: 'register', component: DonorRegisterComponent },
  // Aquí irán las rutas adicionales del donante
  // { path: '', component: DonorDashboardComponent },
  // { path: 'profile', component: DonorProfileComponent },
  // { path: 'donations', component: DonorDonationsComponent },
  // { path: 'donate', component: MakeDonationComponent }
];

@NgModule({
  declarations: [
    // Los componentes standalone no necesitan ser declarados aquí
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    // Los servicios con providedIn: 'root' no necesitan ser declarados aquí
  ]
})
export class DonorModule { }