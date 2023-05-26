import {NgModule} from '@angular/core';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

import {FileUploadModule} from 'ng2-file-upload';
import {MaintenanceRoutingModule} from './maintenance.routing';
import {TranslateModule} from '@ngx-translate/core';
import {SmartTableModule} from 'smart-table-ng';
import {NgbTypeaheadModule, NgbDatepickerModule, NgbButtonsModule, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {NgxMaskModule} from 'ngx-mask';
import {NgSelectModule} from '@ng-select/ng-select';

import {MaintenanceComponent} from './maintenance.component';
import {MaintenanceSearchComponent} from './maintenance-search/maintenance-search.component';
import {MaintenanceAddComponent} from './maintenance-add/maintenance-add.component';
import {CalendarComponent} from './calendar/calendar.component';
import {FullCalendarModule} from '@fullcalendar/angular';
import { GalleryModalComponent } from '../ui-elements/modals/gallery-modal/gallery-modal.component';
import { UIElementsModule } from '../ui-elements/ui-elements.module';
import { MaintenanceExtendedStatusComponent } from './extended/status/maintenance-extended-status.component';
import { MaintenanceExtendedTypeComponent } from './extended/type/maintenance-extended-type.component';
import { MaintenanceDashboardComponent } from './dashboard/maintenance-dashboard.component';
import {ChartsModule} from 'ng2-charts';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  declarations: [
    MaintenanceAddComponent,
    MaintenanceComponent,
    MaintenanceSearchComponent,
    CalendarComponent,
    MaintenanceExtendedStatusComponent,
    MaintenanceExtendedTypeComponent,
    MaintenanceDashboardComponent
  ],
  imports: [
    ChartsModule,
    MaintenanceRoutingModule,
    CommonModule,
    FileUploadModule,
    FullCalendarModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    SmartTableModule,
    NgbTypeaheadModule,
    NgbDatepickerModule,
    NgbModalModule,
    NgbButtonsModule,
    SharedModule,
    NgxMaskModule,
    NgSelectModule,
    UIElementsModule
  ],
  entryComponents: [
    GalleryModalComponent
  ],
  providers: []
})
export class MaintenanceModule {
}
