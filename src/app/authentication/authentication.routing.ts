import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {ForgotComponent} from './forgot/forgot.component';

const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'forgot', component: ForgotComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule {
}
