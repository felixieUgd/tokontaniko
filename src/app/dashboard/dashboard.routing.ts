import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {DashboardAnnouncementComponent} from './announcement/dashboard-announcement.component';
import {DashboardAnnouncementAddComponent} from './announcement/add/dashboard-announcement-add.component';
import {DashboardAnnouncementDetailComponent} from './announcement/detail/dashboard-announcement-detail.component';
import {PerformanceComponent} from './performance/performance.component';

const routes: Routes = [
  {path: '', redirectTo: 'announcement', pathMatch: 'full'},
  {
    path: 'announcement',
    children: [
      {path: '', component: DashboardAnnouncementComponent},
      {path: 'add', component: DashboardAnnouncementAddComponent},
      {path: 'detail/:id', component: DashboardAnnouncementDetailComponent}
    ]
  },
  {path: 'performance', component: PerformanceComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {
}
