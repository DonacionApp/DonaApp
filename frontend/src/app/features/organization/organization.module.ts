import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Aquí irán las rutas de la organización
  // { path: '', component: OrganizationDashboardComponent },
  // { path: 'profile', component: OrganizationProfileComponent },
  // { path: 'campaigns', component: CampaignsComponent },
  // { path: 'donations-received', component: DonationsReceivedComponent }
];

@NgModule({
  declarations: [
    // Aquí irán los componentes de la organización
    // OrganizationDashboardComponent,
    // OrganizationProfileComponent,
    // CampaignsComponent,
    // DonationsReceivedComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    // Aquí irán los servicios específicos de la organización
  ]
})
export class OrganizationModule { }