import {NgModule} from '@angular/core';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {CommonModule, CurrencyPipe} from '@angular/common';

import {AccountingRoutingModule} from './accounting.routing';
import {FileUploadModule} from 'ng2-file-upload';
import {NgbTypeaheadModule, NgbDatepickerModule, NgbButtonsModule} from '@ng-bootstrap/ng-bootstrap';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxMaskModule} from 'ngx-mask';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {SmartTableModule} from 'smart-table-ng';
import {TranslateModule} from '@ngx-translate/core';
import {SharedModule} from '../shared/shared.module';
import {UIElementsModule} from '../ui-elements/ui-elements.module';

import {AccountComponent} from './account/account.component';
import {CategoryComponent} from './category/category.component';
import {ChartsModule} from 'ng2-charts';
import {CurrencyComponent} from './currency/currency.component';
import {IncomeStatementComponent} from './income-statement/income-statement.component';
import {ItemComponent} from './item/item.component';
import {TaxComponent} from './tax/tax.component';
import {TransferComponent} from './transfer/transfer.component';
import {ItemDetailComponent} from './item/item-detail/item-detail.component';

@NgModule({
  declarations: [
    AccountComponent,
    CategoryComponent,
    CurrencyComponent,
    IncomeStatementComponent,
    ItemComponent,
    ItemDetailComponent,
    TaxComponent,
    TransferComponent
  ],
  imports: [
    AccountingRoutingModule,
    ChartsModule,
    CommonModule,
    FileUploadModule,
    FormsModule,
    NgbButtonsModule,
    NgbDatepickerModule,
    NgbTypeaheadModule,
    NgSelectModule,
    NgxMaskModule,
    PerfectScrollbarModule,
    ReactiveFormsModule,
    SmartTableModule,
    SharedModule,
    TranslateModule,
    UIElementsModule
  ],
  providers: [
    CurrencyPipe
  ]
})
export class AccountingModule {
}
