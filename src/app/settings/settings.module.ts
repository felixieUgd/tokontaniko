import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

import {FileUploadModule} from 'ng2-file-upload';
import {NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxMaskModule} from 'ngx-mask';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {SettingsRoutingModule} from './settings.routing';
import {SmartTableModule} from 'smart-table-ng';
import {TranslateModule} from '@ngx-translate/core';

import {GeneralComponent} from './general/general.component';

@NgModule({
  declarations: [
    GeneralComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FileUploadModule,
    PerfectScrollbarModule,
    ReactiveFormsModule,
    NgbTypeaheadModule,
    NgSelectModule,
    NgxMaskModule,
    SettingsRoutingModule,
    SmartTableModule,
    TranslateModule
  ],
  providers: []
})
export class SettingsModule {
}
