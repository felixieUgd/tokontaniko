import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {InvoiceDetailComponent} from './invoice-detail/invoice-detail.component';
import {InvoiceAddComponent} from './invoice-add/invoice-add.component';
import {InvoiceComponent} from './invoice.component';
import {InvoiceDetailDefaultComponent} from './invoice-detail-default/invoice-detail-default.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'add', component: InvoiceAddComponent},
  {path: 'detail/:id', component: InvoiceDetailComponent},
  {path: 'detail/:id/default', component: InvoiceDetailDefaultComponent},
  {path: 'list', component: InvoiceComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceRoutingModule {
}
