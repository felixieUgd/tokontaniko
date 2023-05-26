// Core Modules
import {BrowserModule} from '@angular/platform-browser';
import {NgModule, LOCALE_ID} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {HttpClientModule, HttpClient, HTTP_INTERCEPTORS} from '@angular/common/http';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {environment} from '../environments/environment';
import {RouterTestingModule} from '@angular/router/testing';

// Layout Modules
import {CommonLayoutComponent} from './common/common-layout.component';
import {AuthenticationLayoutComponent} from './common/authentication-layout.component';

// Directives
import {
  NgbDateAdapter,
  NgbDateNativeAdapter,
  NgbDateParserFormatter,
  NgbTypeaheadModule,
  NgbDatepickerModule,
  NgbButtonsModule
} from '@ng-bootstrap/ng-bootstrap';
import {Sidebar_Directives} from './shared/directives/side-nav.directive';
import {Cards_Directives} from './shared/directives/cards.directive';

// Interceptors
import {JwtInterceptor} from './_helpers/jwt-interceptor';
import {ErrorInterceptor} from './_helpers/error-interceptor';

// Routing Modules
import {AppRoutes} from './app.routing';

// Plugins
import {ImageCropperModule} from 'ngx-image-cropper';
import {NgIdleKeepaliveModule} from '@ng-idle/keepalive';
import {NgxMaskModule, MaskPipe} from 'ngx-mask';
import {NgSelectModule} from '@ng-select/ng-select';
import {PERFECT_SCROLLBAR_CONFIG} from 'ngx-perfect-scrollbar';
import {PerfectScrollbarConfigInterface} from 'ngx-perfect-scrollbar';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {ReversePipe} from './_helpers/reverse.pipe';
import {SharedModule} from './shared/shared.module';
import {SmartTableModule} from 'smart-table-ng';
import {TokotanikoDateParserFormatter} from './_helpers/tokotaniko-date-parser-formatter';
import {ThemeConstants} from './shared/config/theme-constant';
import {ToastyModule} from 'ng2-toasty';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {UIElementsModule} from './ui-elements/ui-elements.module';
import {JoyrideModule} from 'ngx-joyride';

// Firebase
import {AngularFireModule} from 'angularfire2';
import {AngularFireAuthModule} from 'angularfire2/auth';
import {AngularFireDatabaseModule} from 'angularfire2/database';

// App Component
import {AppComponent} from './app.component';
import {UploadComponent} from './settings/upload/upload.component';

// Service
import {NotificationService} from './_services/notification.service';
import {RequestInterceptor} from './_helpers/request-interceptor';
import {SidePanelContactComponent} from './ui-elements/side-panel/contact/side-panel-contact.component';
import {SidePanelItemComponent} from './accounting/item/side-panel-item/side-panel-item.component';
import {SidePanelPaymentComponent} from './ui-elements/side-panel/payment/side-panel-payment.component';
import {FirstNamePipe} from './shared/pipe/first-name.pipe';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    JoyrideModule.forRoot(),
    ImageCropperModule,
    NgxMaskModule.forRoot(),
    NgbButtonsModule,
    NgbDatepickerModule,
    NgbTypeaheadModule,
    NgIdleKeepaliveModule.forRoot(),
    NgSelectModule,
    PerfectScrollbarModule,
    ReactiveFormsModule,
    RouterModule.forRoot(AppRoutes, {useHash: false, onSameUrlNavigation: 'reload', anchorScrolling: 'enabled'}),
    RouterTestingModule,
    SharedModule,
    SmartTableModule,
    ToastyModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    UIElementsModule
  ],
  declarations: [
    AppComponent,
    CommonLayoutComponent,
    AuthenticationLayoutComponent,
    Sidebar_Directives,
    Cards_Directives,
    SidePanelContactComponent,
    SidePanelItemComponent,
    SidePanelPaymentComponent,
    UploadComponent,
    ReversePipe
  ],
  providers: [
    MaskPipe,
    CurrencyPipe,
    DatePipe,
    FirstNamePipe,
    NotificationService,
    ThemeConstants,
    {provide: NgbDateAdapter, useClass: NgbDateNativeAdapter},
    {provide: NgbDateParserFormatter, useClass: TokotanikoDateParserFormatter},
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true},
    {
      provide: LOCALE_ID,
      deps: [TranslateService],
      useFactory: (translateService) => translateService.getDefaultLang()
    },
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
