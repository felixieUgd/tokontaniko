import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {SettingsGeographyComponent} from './settings-geography.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list'
  },
  {
    path: 'list',
    component: SettingsGeographyComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsGeographyRoutingModule { }
