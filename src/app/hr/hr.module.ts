import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {HrRoutingModule} from './hr-routing.module';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';

import { FileUploadModule } from 'ng2-file-upload';

import {HrPositionComponent} from './position/hr-position.component';
import {HrPositionDetailComponent} from './position/detail/hr-position-detail.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../shared/shared.module';
import { NgxSummernoteModule } from 'ngx-summernote';

@NgModule({
  declarations: [
    HrPositionComponent,
    HrPositionDetailComponent
  ],
  imports: [
    CommonModule,
    HrRoutingModule,
    FormsModule,
    FileUploadModule,
    SharedModule,
    NgbDatepickerModule,
    NgSelectModule,
    NgxSummernoteModule,
    TranslateModule,
    PerfectScrollbarModule,
    ReactiveFormsModule
  ]
})
export class HrModule {}
