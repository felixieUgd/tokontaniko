import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

import {TranslateModule} from '@ngx-translate/core';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';

import {XhrBtnIndicatorDirective} from './directives/xhr-btn-indicator.directive';
import {ImagesrcDirective} from '../shared/directives/imagesrc.directive';
import {ContactPreviewComponent} from 'src/app/contact/contact-preview/contact-preview.component';
import { SearchFilterPipe } from '../_helpers/search-filter.pipe';
import { VarDirective } from './directives/ng-var.directive';
import {FirstNamePipe} from './pipe/first-name.pipe';

@NgModule({
  declarations: [
    ContactPreviewComponent,
    FirstNamePipe,
    ImagesrcDirective,
    XhrBtnIndicatorDirective,
    SearchFilterPipe,
    VarDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule
  ],
  entryComponents: [
    ContactPreviewComponent
  ],
  providers: [],
  exports: [
    ImagesrcDirective,
    XhrBtnIndicatorDirective,
    FirstNamePipe,
    SearchFilterPipe,
    VarDirective
  ]
})

export class SharedModule {
}
