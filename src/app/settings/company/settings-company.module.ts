import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {SettingsCompanyRoutingModule} from './settings-company-routing.module';
import {TranslateModule} from '@ngx-translate/core';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxMaskModule} from 'ngx-mask';
import {SmartTableModule} from 'smart-table-ng';

import {SettingsCompanyComponent} from './settings-company.component';
import {SettingsCompanyAddComponent} from './add/settings-company-add.component';
import {FileUploadModule} from 'ng2-file-upload';
import { UIElementsModule } from 'src/app/ui-elements/ui-elements.module';

@NgModule({
  declarations: [
    SettingsCompanyComponent,
    SettingsCompanyAddComponent
  ],
  imports: [
    CommonModule,
    FileUploadModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    NgxMaskModule,
    UIElementsModule,
    ReactiveFormsModule,
    SettingsCompanyRoutingModule,
    SmartTableModule,
    TranslateModule
  ]
})
export class SettingsCompanyModule {
}
