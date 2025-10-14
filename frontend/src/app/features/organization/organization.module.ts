import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { OrganizationRegisterComponent } from './components/organization-register/organization-register.component';

const routes: Routes = [
  { path: 'register', component: OrganizationRegisterComponent },
  // Aquí irán las rutas adicionales de la organización
  // { path: '', component: OrganizationDashboardComponent },
  // { path: 'profile', component: OrganizationProfileComponent },
  // { path: 'campaigns', component: CampaignsComponent },
  // { path: 'donations-received', component: DonationsReceivedComponent }
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
export class OrganizationModule { }