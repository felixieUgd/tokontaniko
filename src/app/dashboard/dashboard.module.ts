import {NgModule} from '@angular/core';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

import {ChartsModule} from 'ng2-charts';
import {DashboardRoutingModule} from './dashboard.routing';
import {NgbDatepickerModule, NgbButtonsModule} from '@ng-bootstrap/ng-bootstrap';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxSummernoteModule} from 'ngx-summernote';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {SharedModule} from '../shared/shared.module';
import {TranslateModule} from '@ngx-translate/core';

import {DashboardAnnouncementComponent} from './announcement/dashboard-announcement.component';
import {DashboardAnnouncementAddComponent} from './announcement/add/dashboard-announcement-add.component';
import {DashboardAnnouncementDetailComponent} from './announcement/detail/dashboard-announcement-detail.component';
import {PerformanceComponent} from './performance/performance.component';

@NgModule({
  declarations: [
    DashboardAnnouncementComponent,
    DashboardAnnouncementAddComponent,
    DashboardAnnouncementDetailComponent,
    PerformanceComponent
  ],
  imports: [
    ChartsModule,
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    NgbDatepickerModule,
    NgSelectModule,
    NgbButtonsModule,
    NgxSummernoteModule,
    PerfectScrollbarModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule
  ],
  providers: []
})
export class DashboardModule {
}
