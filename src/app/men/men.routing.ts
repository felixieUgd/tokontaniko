import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {FacilityComponent} from './facility/facility.component';
import {FacilityDetailComponent} from './facility/facility-detail/facility-detail.component';
import {TicketAddComponent} from './ticket/add/ticket-add.component';
import {TicketDetailComponent} from './ticket/detail/ticket-detail.component';
import {MenClaimRegisterComponent} from './claim/register/men-claim-register.component';
import {MenInvoiceDetailComponent} from './invoice/detail/men-invoice-detail.component';
import {MenClaimDetailComponent} from './claim/detail/men-claim-detail.component';
import {MenRequestComponent} from './request/men-request.component';
import {MenRequestSearchComponent} from './request/search/men-request-search.component';
import { MenBillDetailComponent } from './bill/detail/men-bill-detail.component';
import {MenInvoiceGroupComponent} from './invoice/group/men-invoice-group.component';
import {MenInvoiceGroupAddComponent} from './invoice/group/add/men-invoice-group-add.component';
import {MenInvoiceGroupDetailComponent} from './invoice/group/detail/men-invoice-group-detail.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'list', component: FacilityComponent},
  {path: 'request', component: MenRequestComponent},
  {path: 'search', component: MenRequestSearchComponent},
  {path: 'detail/:id', component: FacilityDetailComponent},
  {
    path: 'ticket',
    children: [
      {path: 'add', component: TicketAddComponent},
      {path: 'detail/:id', component: TicketDetailComponent}
    ]
  },
  {
    path: 'bill',
    children: [
      { path: 'detail/:id', component: MenBillDetailComponent }
    ]
  },
  {
    path: 'invoice',
    children: [
      {path: 'detail/:id', component: MenInvoiceDetailComponent},
      {
        path: 'group',
        children: [
          {path: '', pathMatch: 'full', component: MenInvoiceGroupComponent},
          {path: 'add', component: MenInvoiceGroupAddComponent},
          {path: 'detail/:id', component: MenInvoiceGroupDetailComponent}
        ]
      }
    ]
  },
  {
    path: 'claim',
    children: [
      {path: 'register', component: MenClaimRegisterComponent},
      {path: 'detail/:id', component: MenClaimDetailComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MenRoutingModule {
}
