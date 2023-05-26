import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';
import {NgbDatepickerModule, NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';
import {SmartTableModule} from 'smart-table-ng';
import {NgxMaskModule} from 'ngx-mask';
import {NgSelectModule} from '@ng-select/ng-select';
import {InvoiceRoutingModule} from './invoice-routing.module';
import {UIElementsModule} from 'src/app/ui-elements/ui-elements.module';
import {SharedModule} from 'src/app/shared/shared.module';

import {InvoiceComponent} from './invoice.component';
import {InvoiceAddComponent} from './invoice-add/invoice-add.component';
import {InvoiceDetailComponent} from './invoice-detail/invoice-detail.component';
import {InvoiceDetailDefaultComponent} from './invoice-detail-default/invoice-detail-default.component';

@NgModule({
  declarations: [
    InvoiceAddComponent,
    InvoiceComponent,
    InvoiceDetailComponent,
    InvoiceDetailDefaultComponent
  ],
  entryComponents: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InvoiceRoutingModule,
    NgSelectModule,
    NgbDatepickerModule,
    NgbTypeaheadModule,
    NgxMaskModule,
    SmartTableModule,
    TranslateModule,
    SharedModule,
    UIElementsModule
  ]
})
export class InvoiceModule {}
