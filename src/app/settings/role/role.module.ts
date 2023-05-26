import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NgSelectModule} from '@ng-select/ng-select';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {SharedModule} from 'src/app/shared/shared.module';
import {TranslateModule} from '@ngx-translate/core';

import {RoleRoutingModule} from './role-routing.module';
import {RoleComponent} from './role.component';
import {RoleEditComponent} from './role-edit/role-edit.component';

@NgModule({
  declarations: [RoleComponent, RoleEditComponent],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule,
    NgSelectModule,
    ReactiveFormsModule,
    RoleRoutingModule,
    SharedModule,
    TranslateModule
  ]
})
export class RoleModule {}
