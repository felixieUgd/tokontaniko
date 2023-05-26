import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {RoleEditComponent} from './role-edit/role-edit.component';
import {RoleComponent} from './role.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'list', component: RoleComponent},
  {path: 'edit/:id', component: RoleEditComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RoleRoutingModule {
}
