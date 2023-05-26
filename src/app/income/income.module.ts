import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IncomeRoutes} from './income.routing';

import {TranslateModule} from '@ngx-translate/core';
import {SmartTableModule} from 'smart-table-ng';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgbDatepickerModule, NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';
import {NgxMaskModule} from 'ngx-mask';

import {IncomeSearchComponent} from './search/income-search.component';
import {IncomeSummaryComponent} from './summary/income-summary.component';
import {InvoiceSummaryComponent} from './summary/invoice/invoice-summary.component';
import {RevenueSummaryComponent} from './summary/revenue/revenue-summary.component';
import {InvoiceGroupComponent} from './invoice/group/invoice-group.component';
import {InvoiceGroupAddComponent} from './invoice/group/add/invoice-group-add.component';
import {InvoiceGroupDetailComponent} from './invoice/group/detail/invoice-group-detail.component';
import {SharedModule} from '../shared/shared.module';
import {UIElementsModule} from '../ui-elements/ui-elements.module';

@NgModule({
  imports: [
    RouterModule.forChild(IncomeRoutes),
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    NgbTypeaheadModule,
    NgSelectModule,
    NgxMaskModule,
    ReactiveFormsModule,
    SharedModule,
    SmartTableModule,
    TranslateModule,
    UIElementsModule
  ],
  declarations: [
    IncomeSearchComponent,
    IncomeSummaryComponent,
    InvoiceSummaryComponent,
    RevenueSummaryComponent,
    InvoiceGroupComponent,
    InvoiceGroupAddComponent,
    InvoiceGroupDetailComponent
  ]
})
export class IncomeModule {
}
