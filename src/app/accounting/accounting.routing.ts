import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {AccountComponent} from './account/account.component';
import {CategoryComponent} from './category/category.component';
import {CurrencyComponent} from './currency/currency.component';
import {IncomeStatementComponent} from './income-statement/income-statement.component';
import {ItemComponent} from './item/item.component';
import {ItemDetailComponent} from './item/item-detail/item-detail.component';
import {TaxComponent} from './tax/tax.component';
import {TransferComponent} from './transfer/transfer.component';

const routes: Routes = [
  {path: '', redirectTo: 'account'},
  {path: 'account', component: AccountComponent},
  {path: 'category', component: CategoryComponent},
  {path: 'currency', component: CurrencyComponent},
  {path: 'incomeStatement', component: IncomeStatementComponent},
  {
    path: 'item',
    children: [
      {path: '', component: ItemComponent},
      {path: 'detail/:id', component: ItemDetailComponent},
    ]
  },
  {path: 'tax', component: TaxComponent},
  {path: 'transfer', component: TransferComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountingRoutingModule {
}
