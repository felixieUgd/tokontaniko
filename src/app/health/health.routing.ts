import { Routes } from '@angular/router';

import { HealthDiagnosticAddComponent } from './diagnostic/add/health-diagnostic-add.component';
import { HealthConsultationAddComponent } from './consultation/add/health-consultation-add.component';
import { HealthRecordComponent } from './record/health-record.component';
import { HealthReportComponent } from './report/health-report.component';
import { HealthBuildComponent } from './build/health-build.component';
import { HealthAddComponent } from './add/health-add.component';
import { HealthSearchComponent } from './search/health-search.component';
import { HealthDetailComponent } from './detail/health-detail.component';
import { HealthDetailListComponent } from './detail/list/health-detail-list.component';
import { HealthDetailDocumentComponent } from './detail/document/health-detail-document.component';

export const HealthRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'add'
  },
  {
    path: 'add',
    component: HealthAddComponent
  },
  {
    path: 'diagnostic',
    children: [
      { path: '', redirectTo: 'add', pathMatch: 'full' },
      { path: 'add', component: HealthDiagnosticAddComponent },
      { path: 'report', component: HealthReportComponent },
      { path: 'record', component: HealthRecordComponent }
    ]
  },
  {
    path: 'consultation',
    children: [
      { path: '', redirectTo: 'add', pathMatch: 'full' },
      { path: 'add', component: HealthConsultationAddComponent },
      { path: 'report', component: HealthReportComponent },
      { path: 'record', component: HealthRecordComponent }
    ]
  },
  {
    path: 'settings',
    component: HealthBuildComponent
  },
  {
    path: 'search',
    component: HealthSearchComponent
  },
  {
    path: 'detail/:id',
    component: HealthDetailComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list'
      },
      {
        path: 'list',
        component: HealthDetailListComponent
      },
      {
        path: 'document/:id',
        component: HealthDetailDocumentComponent
      }
    ]
  }
];
