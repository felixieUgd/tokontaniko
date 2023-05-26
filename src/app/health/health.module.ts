import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HealthRoutes } from './health.routing';

import { HealthResponseInputDirective } from './response-input/health-response-input.directive';
import { HealthRecursiveViewComponent } from './recursive-view/health-recursive-view.component';
import { HealthBuildSettingsComponent } from './build/build-settings/health-build-settings.component';
import { HealthDiagnosticAddComponent } from './diagnostic/add/health-diagnostic-add.component';
import { HealthConsultationAddComponent } from './consultation/add/health-consultation-add.component';
import { HealthDiagnosticReportComponent } from './diagnostic/report/health-diagnostic-report.component';
import { HealthRecordComponent } from './record/health-record.component';
import { HealthReportComponent } from './report/health-report.component';

import { JoyrideModule } from 'ngx-joyride';
import { SmartTableModule } from 'smart-table-ng';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../shared/shared.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { UIElementsModule } from '../ui-elements/ui-elements.module';
import { NgbButtonsModule, NgbDatepickerModule, NgbModalModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { HealthBuildComponent } from './build/health-build.component';
import { HealthAddComponent } from './add/health-add.component';
import { HealthComponent } from './health.component';
import { HealthDetailComponent } from './detail/health-detail.component';
import { HealthSearchComponent } from './search/health-search.component';
import { HealthDetailListComponent } from './detail/list/health-detail-list.component';
import { FileUploadModule } from 'ng2-file-upload';
import { QRCodeModule } from 'angularx-qrcode';
import { ContactPreviewComponent } from '../contact/contact-preview/contact-preview.component';

@NgModule({
  declarations: [
    HealthDiagnosticAddComponent,
    HealthDiagnosticReportComponent,
    HealthRecursiveViewComponent,
    HealthResponseInputDirective,
    HealthConsultationAddComponent,
    HealthRecordComponent,
    HealthBuildSettingsComponent,
    HealthReportComponent,
    HealthBuildComponent,
    HealthAddComponent,
    HealthComponent,
    HealthDetailComponent,
    HealthSearchComponent,
    HealthDetailListComponent
  ],
  imports: [
    RouterModule.forChild(HealthRoutes),
    CommonModule,
    FormsModule,
    NgbTypeaheadModule,
    NgbDatepickerModule,
    NgbTooltipModule,
    NgbModalModule,
    NgbButtonsModule,
    NgSelectModule,
    NgbTypeaheadModule,
    ReactiveFormsModule,
    JoyrideModule.forChild(),
    SharedModule,
    SmartTableModule,
    FileUploadModule,
    QRCodeModule,
    UIElementsModule,
    TranslateModule,
    PerfectScrollbarModule
  ],
  entryComponents: [
    ContactPreviewComponent
  ]
})
export class HealthModule { }
