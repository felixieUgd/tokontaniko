import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {SmartTableModule} from 'smart-table-ng';
import {TranslateModule} from '@ngx-translate/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';

import {SettingsStructureRoutingModule} from './settings-structure-routing.module';
import {SettingsStructureFacilityComponent} from './facility/settings-structure-facility.component';
import {SettingsStructureFacilityTypeComponent} from './facility/type/settings-structure-facility-type.component';
import { SettingsStructureRoomComponent } from './room/settings-structure-room.component';
import { SettingsStructureRoomTypeComponent } from './room/type/settings-structure-room-type.component';
import {NgbButtonsModule} from '@ng-bootstrap/ng-bootstrap';
import { SettingsStructureStorageComponent } from './storage/settings-structure-storage.component';
import {SharedModule} from 'src/app/shared/shared.module';

@NgModule({
  declarations: [SettingsStructureFacilityComponent, SettingsStructureFacilityTypeComponent, SettingsStructureRoomComponent, SettingsStructureRoomTypeComponent, SettingsStructureStorageComponent],
  imports: [
    CommonModule,
    SmartTableModule,
    FormsModule,
    NgbButtonsModule,
    SharedModule,
    ReactiveFormsModule,
    NgSelectModule,
    TranslateModule,
    SettingsStructureRoutingModule
  ]
})
export class SettingsStructureModule { }
