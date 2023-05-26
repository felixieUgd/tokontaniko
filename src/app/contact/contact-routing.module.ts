import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ContactDetailComponent} from './detail/contact-detail.component';
import {ContactListComponent} from './contact.component';

const routes: Routes = [
  {path: '', redirectTo: 'list', pathMatch: 'full'},
  {path: 'detail/:id', component: ContactDetailComponent},
  {path: 'list', component: ContactListComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactRoutingModule {
}
