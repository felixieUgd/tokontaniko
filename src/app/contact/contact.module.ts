import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ChartsModule} from 'ng2-charts';
import {ContactRoutingModule} from './contact-routing.module';
import {FileUploadModule} from 'ng2-file-upload';
import {NgbModalModule, NgbDatepickerModule, NgbTypeaheadModule, NgbButtonsModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {NgxMaskModule} from 'ngx-mask';
import {QRCodeModule} from 'angularx-qrcode';
import {SharedModule} from '../shared/shared.module';
import {SmartTableModule} from 'smart-table-ng';
import {TranslateModule} from '@ngx-translate/core';
import {UIElementsModule} from '../ui-elements/ui-elements.module';

import {ContactDetailComponent} from './detail/contact-detail.component';
import {ContactInvoiceComponent} from './detail/invoice/contact-invoice.component';
import {ContactListComponent} from './contact.component';
import {ContactPreviewComponent} from './contact-preview/contact-preview.component';
import {NgSelectModule} from '@ng-select/ng-select';

@NgModule({
  declarations: [
    ContactDetailComponent,
    ContactInvoiceComponent,
    ContactListComponent
  ],
  imports: [
    ChartsModule,
    CommonModule,
    ContactRoutingModule,
    FileUploadModule,
    FormsModule,
    NgbButtonsModule,
    NgbDatepickerModule,
    NgxMaskModule.forRoot(),
    NgbModalModule,
    NgbTooltipModule,
    NgbTypeaheadModule,
    NgSelectModule,
    QRCodeModule,
    ReactiveFormsModule,
    SharedModule,
    SmartTableModule,
    TranslateModule,
    UIElementsModule
  ],
  entryComponents: [
    ContactPreviewComponent
  ]
})
export class ContactModule {}
