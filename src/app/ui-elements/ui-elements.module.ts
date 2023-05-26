import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';

import {NgbButtonsModule, NgbDatepickerModule, NgbModalModule, NgbTooltipModule, NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';
import {NgxMaskModule} from 'ngx-mask';
import {NgSelectModule} from '@ng-select/ng-select';
import {TranslateModule} from '@ngx-translate/core';
import {SharedModule} from '../shared/shared.module';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';

import {ListHistoryComponent} from './tables/history/list-history.component';
import {InputPhoneComponent} from './forms/input-phone/input-phone.component';
import {ListInvoiceComponent} from './tables/invoice/list-invoice.component';
import {TypeaheadContactComponent} from './forms/typeadhead-contact/typeahead-contact.component';
import {LockScreenComponent} from './modals/lock-screen/lock-screen.component';
import {ListPaymentComponent} from './tables/payment/list-payment.component';
import {DashboardCardComponent} from './cards/dashboard/dashboard-card.component';
import {ConfirmModalComponent} from './modals/confirm-modal/confirm-modal.component';
import {GalleryModalComponent} from './modals/gallery-modal/gallery-modal.component';
import {FileAttachmentComponent} from './file-attachment/file-attachment.component';
import {FileUploadModule} from 'ng2-file-upload';
import {ListBillComponent} from './tables/bill/list-bill/list-bill.component';
import {PaginateBillComponent} from './tables/bill/paginate-bill/paginate-bill.component';
import {SmartTableModule} from 'smart-table-ng';
import {PaginateInvoiceComponent} from './tables/invoice/paginate-invoice/paginate-invoice.component';
import {SearchGeographyFacilityComponent} from './forms/search-geography-facility/search-geography-facility.component';
import {UpdateLockScreenComponent} from './modals/update-lock-screen/update-lock-screen.component';
import {MedicalAccordionComponent} from './accordions/medical-accordion/medical-accordion.component';
import {HealthTreeViewComponent} from './tree-view/health-tree-view.component';
import {HealthTreeViewContentComponent} from './tree-view/content/health-tree-view-content.component';
import {SidePanelTransferComponent} from './side-panel/transfer/side-panel-transfer.component';
import {MaintenanceDetailComponent} from '../maintenance/maintenance-detail/maintenance-detail.component';
import {HealthDetailDocumentComponent} from '../health/detail/document/health-detail-document.component';
import {NgxSummernoteModule} from 'ngx-summernote';
import { AppendItemModalComponent } from './modals/append-item-modal/append-item-modal.component';
import { RoomSelectComponent } from './forms/room-select/room-select.component';
import { SidePanelFacilityAddComponent } from './side-panel/facility/add/side-panel-facility-add.component';
import { SidePanelNoteComponent } from './side-panel/note/side-panel-note.component';

@NgModule({
  declarations: [
    ConfirmModalComponent,
    DashboardCardComponent,
    FileAttachmentComponent,
    GalleryModalComponent,
    HealthTreeViewComponent,
    HealthTreeViewContentComponent,
    InputPhoneComponent,
    ListBillComponent,
    ListHistoryComponent,
    ListInvoiceComponent,
    ListPaymentComponent,
    LockScreenComponent,
    MedicalAccordionComponent,
    PaginateBillComponent,
    PaginateInvoiceComponent,
    SearchGeographyFacilityComponent,
    SidePanelTransferComponent,
    MaintenanceDetailComponent,
    TypeaheadContactComponent,
    UpdateLockScreenComponent,
    HealthDetailDocumentComponent,
    AppendItemModalComponent,
    RoomSelectComponent,
    SidePanelFacilityAddComponent,
    SidePanelNoteComponent
  ],
  imports: [
    CommonModule,
    FileUploadModule,
    FormsModule,
    NgbDatepickerModule,
    NgbModalModule,
    NgbTypeaheadModule,
    NgSelectModule,
    NgbButtonsModule,
    NgbTooltipModule,
    NgxMaskModule,
    NgxSummernoteModule,
    PerfectScrollbarModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    SmartTableModule,
    TranslateModule
  ],
  exports: [
    DashboardCardComponent,
    GalleryModalComponent,
    FileAttachmentComponent,
    HealthTreeViewComponent,
    InputPhoneComponent,
    ListBillComponent,
    ListHistoryComponent,
    ListInvoiceComponent,
    ListPaymentComponent,
    MedicalAccordionComponent,
    PaginateBillComponent,
    PaginateInvoiceComponent,
    SearchGeographyFacilityComponent,
    SidePanelTransferComponent,
    SidePanelFacilityAddComponent,
    HealthDetailDocumentComponent,
    TypeaheadContactComponent,
    AppendItemModalComponent,
    RoomSelectComponent,
    MaintenanceDetailComponent,
    UpdateLockScreenComponent,
    SidePanelNoteComponent,
  ],
  entryComponents: [
    ConfirmModalComponent,
    GalleryModalComponent,
    AppendItemModalComponent,
    LockScreenComponent,
    HealthDetailDocumentComponent,
    MaintenanceDetailComponent,
    UpdateLockScreenComponent
  ]
})
export class UIElementsModule {
}
