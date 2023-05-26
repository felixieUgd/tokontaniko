import {Routes} from '@angular/router';
import {IncomeSummaryComponent} from './summary/income-summary.component';
import {IncomeSearchComponent} from './search/income-search.component';
import {InvoiceGroupComponent} from './invoice/group/invoice-group.component';
import {InvoiceGroupAddComponent} from './invoice/group/add/invoice-group-add.component';
import {InvoiceGroupDetailComponent} from './invoice/group/detail/invoice-group-detail.component';

export const IncomeRoutes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'invoice', loadChildren: './invoice/invoice.module#InvoiceModule'},
  {path: 'list', component: IncomeSummaryComponent},
  {path: 'search', component: IncomeSearchComponent},
  {
    path: 'group',
    children: [
      {
        path: '',
        component: InvoiceGroupComponent
      },
      {
        path: 'add',
        component: InvoiceGroupAddComponent
      },
      {
        path: 'detail/:id',
        component: InvoiceGroupDetailComponent
      }
    ]
  }
];

