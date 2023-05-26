import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsGeographyRoutingModule } from './settings-geography-routing.module';
import { SettingsGeographyComponent } from './settings-geography.component';
import {SharedModule} from 'src/app/shared/shared.module';
import {SmartTableModule} from 'smart-table-ng';
import {TranslateModule} from '@ngx-translate/core';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@NgModule({
  declarations: [SettingsGeographyComponent],
  imports: [
    CommonModule,
    SettingsGeographyRoutingModule,
    SharedModule,
    SmartTableModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule
  ]
})
export class SettingsGeographyModule { }
