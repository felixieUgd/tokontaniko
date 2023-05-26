import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {BillAddComponent} from './bill-add/bill-add.component';
import {BillDetailDefaultComponent} from './bill-detail-default/bill-detail-default.component';
import {BillDetailComponent} from './bill-detail/bill-detail.component';
import {BillComponent} from './bill.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'add', component: BillAddComponent},
  {path: 'detail/:id', component: BillDetailComponent},
  {path: 'detail/:id/default', component: BillDetailDefaultComponent},
  {path: 'edit/:id', component: BillAddComponent},
  {path: 'list', component: BillComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillRoutingModule {
}
