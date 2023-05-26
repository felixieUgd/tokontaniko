import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {HrPositionComponent} from './position/hr-position.component';
import {HrPositionDetailComponent} from './position/detail/hr-position-detail.component';

const routes: Routes = [
  {path: '', redirectTo: 'position', pathMatch: 'full'},
  {
    path: 'position',
    children: [
      {path: '', component: HrPositionComponent},
      {path: 'detail/:id', component: HrPositionDetailComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrRoutingModule {
}
