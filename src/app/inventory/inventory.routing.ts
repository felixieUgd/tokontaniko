import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {InventoryComponent} from './inventory.component';
import {InventoryEntryComponent} from './entry/inventory-entry.component';
import {InventoryEntryDetailComponent} from './entry/detail/inventory-entry-detail.component';
import {InventoryOutComponent} from './out/inventory-out.component';
import {InventoryOutDetailComponent} from './out/detail/inventory-out-detail.component';
import { InventoryDetailComponent } from './detail/inventory-detail.component';
import { InventoryOutAddComponent } from './out/add/inventory-out-add.component';
import {InventoryOutSearchComponent} from './out/search/inventory-out-search.component';
import {InventoryOrderAddComponent} from './order/add/inventory-order-add.component';
import {InventoryOrderComponent} from './order/inventory-order.component';
import {InventoryOrderDetailComponent} from './order/detail/inventory-order-detail.component';
import {InventoryShippingComponent} from './out/shipping/inventory-shipping.component';
import {InventoryOrderSearchComponent} from './order/search/inventory-order-search.component';

const routes: Routes = [
  {path: '', redirectTo: 'out', pathMatch: 'full'},
  {path: 'list', component: InventoryComponent},
  {
    path: 'detail/:id',
    component: InventoryDetailComponent
  },
  {
    path: 'entry',
    children: [
      {path: '', component: InventoryEntryComponent},
      {path: 'detail/:id', component: InventoryEntryDetailComponent},
    ]
  },
  {
    path: 'out',
    children: [
      {path: '', pathMatch: 'full', redirectTo: 'search'},
      {path: 'search', component: InventoryOutSearchComponent},
      {path: 'list', component: InventoryOutComponent},
      {path: 'add', component: InventoryOutAddComponent},
      {path: 'detail/:id', component: InventoryOutDetailComponent},
      {path: 'shipping', component: InventoryShippingComponent}
    ]
  },
  {
    path: 'order',
    children: [
      {path: '', pathMatch: 'full', redirectTo: 'add'},
      {path: 'add', component: InventoryOrderAddComponent},
      {path: 'list', component: InventoryOrderComponent},
      {path: 'search', component: InventoryOrderSearchComponent},
      {path: 'detail/:id', component: InventoryOrderDetailComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule {
}
