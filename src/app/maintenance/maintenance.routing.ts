import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {CalendarComponent} from './calendar/calendar.component';
import {MaintenanceComponent} from './maintenance.component';
import {MaintenanceDetailComponent} from './maintenance-detail/maintenance-detail.component';
import {MaintenanceSearchComponent} from './maintenance-search/maintenance-search.component';
import {MaintenanceAddComponent} from './maintenance-add/maintenance-add.component';
import {MaintenanceExtendedStatusComponent} from './extended/status/maintenance-extended-status.component';
import {MaintenanceExtendedTypeComponent} from './extended/type/maintenance-extended-type.component';
import {MaintenanceDashboardComponent} from './dashboard/maintenance-dashboard.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'list', component: MaintenanceComponent},
  {path: 'calendar', component: CalendarComponent},
  {path: 'add', component: MaintenanceAddComponent},
  {path: 'dashboard', component: MaintenanceDashboardComponent},
  {path: 'detail/:id', component: MaintenanceDetailComponent},
  {path: 'search', component: MaintenanceSearchComponent},
  {
    path: 'extended',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'status'
      },
      {
        path: 'status',
        component: MaintenanceExtendedStatusComponent
      },
      {
        path: 'type',
        component: MaintenanceExtendedTypeComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MaintenanceRoutingModule {
}
