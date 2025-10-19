import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Aquí irán las rutas del administrador
  // { path: '', component: AdminDashboardComponent },
  // { path: 'users', component: UsersManagementComponent },
  // { path: 'organizations', component: OrganizationsManagementComponent },
  // { path: 'reports', component: ReportsComponent }
];

@NgModule({
  declarations: [
    // Aquí irán los componentes del administrador
    // AdminDashboardComponent,
    // UsersManagementComponent,
    // OrganizationsManagementComponent,
    // ReportsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    // Aquí irán los servicios específicos del administrador
  ]
})
export class AdminModule { }