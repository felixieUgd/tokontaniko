import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {GeneralComponent} from './general/general.component';

const routes: Routes = [
  {path: '', redirectTo: 'general'},
  {path: 'general', component: GeneralComponent},
  {path: 'company', loadChildren: './company/settings-company.module#SettingsCompanyModule'},
  {path: 'role', loadChildren: './role/role.module#RoleModule'},
  {path: 'user', loadChildren: './user/user.module#UserModule'},
  {path: 'structure', loadChildren: './structure/settings-structure.module#SettingsStructureModule'},
  {path: 'geography', loadChildren: './geography/settings-geography.module#SettingsGeographyModule'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {
}
