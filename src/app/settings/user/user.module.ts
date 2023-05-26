import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {FileUploadModule} from 'ng2-file-upload';
import {NgbDatepickerModule, NgbButtonsModule} from '@ng-bootstrap/ng-bootstrap';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxMaskModule} from 'ngx-mask';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {QRCodeModule} from 'angularx-qrcode';
import {SharedModule} from '../../shared/shared.module';
import {SmartTableModule} from 'smart-table-ng';
import {TranslateModule} from '@ngx-translate/core';
import {UserRoutingModule} from './user-routing.module';
import {UIElementsModule} from 'src/app/ui-elements/ui-elements.module';

import {UserAddComponent} from './user-add/user-add.component';
import {UserEditComponent} from './user-edit/user-edit.component';
import {UserEventModalComponent} from './user-event-modal/user-event-modal.component';
import {UserListComponent} from './user-list/user-list.component';

@NgModule({
  declarations: [
    UserListComponent,
    UserAddComponent,
    UserEditComponent,
    UserEventModalComponent
  ],
  imports: [
    CommonModule,
    FileUploadModule,
    FormsModule,
    NgbDatepickerModule,
    NgbButtonsModule,
    NgSelectModule,
    NgxMaskModule,
    PerfectScrollbarModule,
    QRCodeModule,
    ReactiveFormsModule,
    SharedModule,
    SmartTableModule,
    TranslateModule,
    UserRoutingModule,
    UIElementsModule
  ],
  entryComponents: [
    UserEventModalComponent
  ]
})
export class UserModule { }
