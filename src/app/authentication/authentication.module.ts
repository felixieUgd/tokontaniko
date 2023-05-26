import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

import {AuthenticationRoutingModule} from './authentication.routing';

import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {ForgotComponent} from './forgot/forgot.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    ForgotComponent
  ],
  imports: [
    AuthenticationRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedModule
  ],
  providers: []
})
export class AuthenticationModule {
}
