import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';
import {SmartTableModule} from 'smart-table-ng';
import {NgxMaskModule} from 'ngx-mask';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgbDatepickerModule, NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';

import {BillRoutingModule} from './bill-routing.module';
import {SharedModule} from 'src/app/shared/shared.module';
import {UIElementsModule} from 'src/app/ui-elements/ui-elements.module';

import {BillDetailComponent} from './bill-detail/bill-detail.component';
import {BillAddComponent} from './bill-add/bill-add.component';
import {BillComponent} from './bill.component';
import {BillDetailDefaultComponent} from './bill-detail-default/bill-detail-default.component';

@NgModule({
  declarations: [
    BillAddComponent,
    BillDetailComponent,
    BillDetailDefaultComponent,
    BillComponent
  ],
  imports: [
    BillRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgbDatepickerModule,
    NgbTypeaheadModule,
    TranslateModule,
    SmartTableModule,
    NgxMaskModule,
    SharedModule,
    UIElementsModule
  ],
  entryComponents: [
  ],
  exports: [
  ]
})
export class BillModule {
}
