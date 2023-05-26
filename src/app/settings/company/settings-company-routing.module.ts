import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {SettingsCompanyComponent} from './settings-company.component';
import {SettingsCompanyAddComponent} from './add/settings-company-add.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'add', component: SettingsCompanyAddComponent},
  {path: 'edit/:id', component: SettingsCompanyAddComponent},
  {path: 'list', component: SettingsCompanyComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsCompanyRoutingModule {
}
