import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Aquí irán las rutas del donante
  // { path: '', component: DonorDashboardComponent },
  // { path: 'profile', component: DonorProfileComponent },
  // { path: 'donations', component: DonorDonationsComponent },
  // { path: 'donate', component: MakeDonationComponent }
];

@NgModule({
  declarations: [
    // Aquí irán los componentes del donante
    // DonorDashboardComponent,
    // DonorProfileComponent,
    // DonorDonationsComponent,
    // MakeDonationComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    // Aquí irán los servicios específicos del donante
  ]
})
export class DonorModule { }