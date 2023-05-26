import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SummaryComponent} from './summary/summary.component';
import {ExpenseSearchComponent} from './search/expense-search.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'bill', loadChildren: './bill/bill.module#BillModule'},
  {path: 'list', component: SummaryComponent},
  {path: 'search', component: ExpenseSearchComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpenseRoutingModule {
}
