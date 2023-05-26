import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {InventoryComponent} from './inventory.component';
import {InventoryEntryComponent} from './entry/inventory-entry.component';
import {InventoryEntryDetailComponent} from './entry/detail/inventory-entry-detail.component';
import {InventoryOutComponent} from './out/inventory-out.component';
import {InventoryOutDetailComponent} from './out/detail/inventory-out-detail.component';

import {InventoryRoutingModule} from './inventory.routing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgbDatepickerModule, NgbModalModule, NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {SmartTableModule} from 'smart-table-ng';
import {UIElementsModule} from '../ui-elements/ui-elements.module';
import {NgxMaskModule} from 'ngx-mask';
import { InventoryReportListComponent } from './report-list/inventory-report-list.component';
import { InventoryDetailComponent } from './detail/inventory-detail.component';
import { SharedModule } from '../shared/shared.module';
import { InventoryOutAddComponent } from './out/add/inventory-out-add.component';
import { InventoryOutSearchComponent } from './out/search/inventory-out-search.component';
import { InventoryOrderAddComponent } from './order/add/inventory-order-add.component';
import { InventoryOrderComponent } from './order/inventory-order.component';
import { InventoryOrderDetailComponent } from './order/detail/inventory-order-detail.component';
import { InventoryShippingComponent } from './out/shipping/inventory-shipping.component';
import { InventoryOrderSearchComponent } from './order/search/inventory-order-search.component';

@NgModule({
  declarations: [
    InventoryComponent,
    InventoryEntryComponent,
    InventoryEntryDetailComponent,
    InventoryOutComponent,
    InventoryOutDetailComponent,
    InventoryReportListComponent,
    InventoryDetailComponent,
    InventoryOutAddComponent,
    InventoryOutSearchComponent,
    InventoryOrderAddComponent,
    InventoryOrderComponent,
    InventoryOrderDetailComponent,
    InventoryShippingComponent,
    InventoryOrderSearchComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    InventoryRoutingModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbTypeaheadModule,
    NgbModalModule,
    NgSelectModule,
    NgxMaskModule,
    SmartTableModule,
    TranslateModule,
    SharedModule,
    UIElementsModule
  ]
})
export class InventoryModule { }
