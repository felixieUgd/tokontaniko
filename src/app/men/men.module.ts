import {ArchwizardModule} from 'angular-archwizard';
import {CommonModule} from '@angular/common';
import {FacilityComponent} from './facility/facility.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MenRoutingModule} from './men.routing';
import {NgbButtonsModule, NgbDatepickerModule, NgbTypeaheadModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {NgxMaskModule} from 'ngx-mask';
import {NgModule} from '@angular/core';
import {NgSelectModule} from '@ng-select/ng-select';
import {SmartTableModule} from 'smart-table-ng';
import {TranslateModule} from '@ngx-translate/core';
import {UIElementsModule} from '../ui-elements/ui-elements.module';
import {SharedModule} from '../shared/shared.module';

import {FacilityDetailComponent} from './facility/facility-detail/facility-detail.component';
import {FileUploadModule} from 'ng2-file-upload';
import {MenClaimRegisterComponent} from './claim/register/men-claim-register.component';
import {MenInvoiceDetailComponent} from './invoice/detail/men-invoice-detail.component';
import {MenRequestComponent} from './request/men-request.component';
import {TicketAddComponent} from './ticket/add/ticket-add.component';
import {TicketDetailComponent} from './ticket/detail/ticket-detail.component';
import {MenClaimDetailComponent} from './claim/detail/men-claim-detail.component';
import {SidePanelFacilityComponent} from '../ui-elements/side-panel/facility/side-panel-facility.component';
import {MenInvoiceAddModalComponent} from './invoice/add-modal/men-invoice-add-modal.component';
import {MenRequestSearchComponent} from './request/search/men-request-search.component';
import { BillAddModalComponent } from './bill/bill-add-modal/bill-add-modal.component';
import { MenBillDetailComponent } from './bill/detail/men-bill-detail.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { MenInvoiceGroupComponent } from './invoice/group/men-invoice-group.component';
import { MenInvoiceGroupAddComponent } from './invoice/group/add/men-invoice-group-add.component';
import { MenInvoiceGroupDetailComponent } from './invoice/group/detail/men-invoice-group-detail.component';

@NgModule({
  declarations: [
    FacilityComponent,
    FacilityDetailComponent,
    TicketAddComponent,
    TicketDetailComponent,
    MenClaimDetailComponent,
    MenClaimRegisterComponent,
    BillAddModalComponent,
    MenInvoiceAddModalComponent,
    MenInvoiceDetailComponent,
    MenRequestComponent,
    MenRequestSearchComponent,
    SidePanelFacilityComponent,
    MenBillDetailComponent,
    MenInvoiceGroupComponent,
    MenInvoiceGroupAddComponent,
    MenInvoiceGroupDetailComponent,
  ],
  imports: [
    ArchwizardModule,
    CommonModule,
    FileUploadModule,
    FormsModule,
    MenRoutingModule,
    NgbButtonsModule,
    NgbDatepickerModule,
    NgxMaskModule,
    NgSelectModule,
    NgbTypeaheadModule,
    ReactiveFormsModule,
    SharedModule,
    PerfectScrollbarModule,
    SmartTableModule,
    TranslateModule,
    UIElementsModule,
    NgbTooltipModule
  ],
  entryComponents: [
    MenInvoiceAddModalComponent,
    BillAddModalComponent
  ]
})
export class MENModule {
}
