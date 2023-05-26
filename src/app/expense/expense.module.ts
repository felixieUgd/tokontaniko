import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ExpenseRoutingModule} from './expense-routing.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {SmartTableModule} from 'smart-table-ng';
import {NgSelectModule} from '@ng-select/ng-select';

import {BillSummaryComponent} from './summary/bill/bill-summary.component';
import {ExpenseSearchComponent} from './search/expense-search.component';
import {ExpenseSummaryComponent} from './summary/expense/expense-summary.component';
import {SummaryComponent} from './summary/summary.component';
import {TranslateModule} from '@ngx-translate/core';
import {UIElementsModule} from '../ui-elements/ui-elements.module';
import {SharedModule} from '../shared/shared.module';
import {NgxMaskModule} from 'ngx-mask';

@NgModule({
  declarations: [
    SummaryComponent,
    BillSummaryComponent,
    ExpenseSummaryComponent,
    ExpenseSearchComponent
  ],
  imports: [
    CommonModule,
    ExpenseRoutingModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    NgxMaskModule,
    ReactiveFormsModule,
    SharedModule,
    SmartTableModule,
    TranslateModule,
    UIElementsModule
  ]
})
export class ExpenseModule {
}
