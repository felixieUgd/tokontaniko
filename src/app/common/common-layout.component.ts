import {Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, TemplateRef, HostListener} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {RouteConfigLoadEnd, RouteConfigLoadStart, Router} from '@angular/router';

declare var $: any; // JQuery
import * as moment from 'moment';
import _forEach from 'lodash.foreach';
import {environment} from '../../environments/environment';
import _orderBy from 'lodash.orderby';
import Contact from '../models/contact';
import Company from '../models/company';
import User from '../models/user';

import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import {AppService} from '../app.service';
import {AuthenticationService} from '../_services/authentication.service';
import {ChatService} from '../_services/chat.service';
import {ContactService} from '../contact/contact.service';
import {NotificationService} from '../_services/notification.service';
import {SharedService} from '../_services/shared.service';
import {SettingsCompanyService} from '../settings/company/settings-company.service';
import {SessionService} from '../_services/session.service';
import {TranslateService} from '@ngx-translate/core';
import {UtilityService} from '../_services/utility.service';
import {JoyrideService} from 'ngx-joyride';
import {JoyrideOptions} from 'ngx-joyride/src/models/joyride-options.class';
import {UpdateLockScreenComponent} from '../ui-elements/modals/update-lock-screen/update-lock-screen.component';
import {UpdateService} from '../_services/update.service';
import {ImageService} from '../_services/image.service';
import {Idle} from '@ng-idle/core';
import {SidePanelNoteService} from '../ui-elements/side-panel/note/side-panel-note.service';

const VERSION = environment.version;

interface Korana {
  text?: string;
  name?: string;
  user_id?: string;
  created?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './common-layout.component.html',
  styleUrls: ['../../assets/scss/plugins/_datepicker.scss']
})
export class CommonLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('korana') private korana: ElementRef;

  public app: any;
  public app_version;
  public app_copyright;
  public session;
  public user;
  public headerThemes: any;
  public changeHeader: any;
  public sidenavThemes: any;
  public changeSidenav: any;
  public headerSelected: any;
  public sidenavSelected: any;

  cardContact: Contact;
  companies: Company[];
  messageForm: FormGroup;
  messagesList: any;
  searchForm: FormGroup;
  subscriptions: Subscription[] = [];

  activeMenu: any;
  channels: any[];
  messageNotification: boolean = false;

  updateModalRef: NgbModalRef;
  lockObserver: IntersectionObserver;
  disposeLock: boolean;

  currentLang;
  isTimeOk = true;
  logoUrl = AppService.DEFAULT_LOGO;
  minDate;
  redirectLink;
  selectedChannel;
  today;
  userProfileUrl = AppService.DEFAULT_IMAGE;
  worldTime;

  @ViewChild('card') card: ElementRef;
  @ViewChild('searchDropdown') searchDropdown: ElementRef;

  @ViewChild('onboardingModal', {read: TemplateRef}) onboardingModalTemplate: TemplateRef<any>;
  onboardingModalRef: NgbModalRef;
  moduleLoading: string;

  constructor(
    private appService: AppService,
    private updateService: UpdateService,
    private chatService: ChatService,
    private http: HttpClient,
    private router: Router,
    private idle: Idle,
    private formBuilder: FormBuilder,
    private authService: AuthenticationService,
    private contactService: ContactService,
    private modalService: NgbModal,
    private notification: NotificationService,
    private imageService: ImageService,
    private sessionService: SessionService,
    private settingsCompanyService: SettingsCompanyService,
    private sharedService: SharedService,
    private sidePanelNoteService: SidePanelNoteService,
    private joyrideService: JoyrideService,
    public translate: TranslateService,
    public utilityService: UtilityService
  ) {
    this.themesConfig();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.code && e.code.toLowerCase() === 'f8') {
      e.preventDefault();

      const state = this.sidePanelNoteService.sidePanel.getValue();
      this.openNoteEditor(!state);
    }
  }

  ngOnInit() {
    this.session = JSON.parse(sessionStorage.getItem('session'));

    this.app_copyright = new Date().getFullYear();
    this.app_version = VERSION;
    this.currentLang = this.translate.getDefaultLang();
    this.minDate = this.appService.getMinDate();
    this.redirectLink = this.sessionService.getDefaultRoute();
    this.today = new Date();
    this.user = this.session ? this.session.user : {};
    this.activeMenu = this.sessionService.getActiveMenu();
    this.user = this.sessionService.getUser();
    this.userProfileUrl = this.utilityService.getImageUrl(this.user.photo, 'STATIC', 'photo');

    // this.getWorldTime();
    this.getCompanies();
    this.getCompanyInfo();
    this.initMessageForm();
    this.initSearchForm();
    this.loadImage();

    if (environment.production) {
      this.idle.watch();
    }

    this.subscriptions.push(
      this.chatService.getMessages().subscribe(messagesList => {
        this.messagesList = messagesList;
        this.messageNotification = true;
      })
    );

    this.subscriptions.push(
      this.updateService.updateStatusChanged().subscribe(status => {
        this.toggleLockScreenModal(status);
      })
    );

    this.subscriptions.push(
      this.router.events.subscribe(event => {
        if (event instanceof RouteConfigLoadStart) {
          const split = event.route.loadChildren.toString().split('#');
          this.moduleLoading = split[split.length - 1];
        } else if (event instanceof RouteConfigLoadEnd) {
          this.moduleLoading = null;
        }
      })
    );
  }

  ngAfterViewInit(): void {
    const ctrl = this;
    //  Prevent auto close on click
    $('#searchDropdown .dropdown-menu').on('click', function (e) {
      e.stopPropagation();
    });

    //  Clear search form on dropdown shown
    $('#searchDropdown').on('show.bs.dropdown', function (e) {
      ctrl.searchForm.reset();
    });

    if (this.activeMenu.men && this.activeMenu.men.root) {
      setTimeout(() => {
        if (this.user && this.user.extra && this.user.extra.onboarded === false) {
          this.onboardingModalRef = this.modalService.open(this.onboardingModalTemplate);
          this.onboardingModalRef.result.then(() => {
            this.sessionService.setOnboarded();
          }).catch((isDestroyed) => {
            if (!isDestroyed) {
              this.sessionService.setOnboarded();
            }
          });
        }
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());

    if (this.onboardingModalRef) {
      this.onboardingModalRef.dismiss(true);
    }
  }

  changeTranslation(lang) {
    this.translate.use(lang);
    this.currentLang = lang;
  }

  getActiveCompany() {
    return this.sessionService.getActiveCompany();
  }

  logout() {
    this.authService.logout();
  }

  onSelectSearch(event): void {
    event.preventDefault();

    if (event.item) {
      this.router.navigate(['/contact/detail', event.item.id]);
      this.searchForm.reset();
    }
    else {
      this.sharedService.newContact(this.searchForm.get('term').value);
      this.sharedService.updateSidePanel(true);
    }
  }

  openContact(modal) {
    modal.dismiss();
    this.router.navigate(['/contact/detail/', this.cardContact.id]);
    this.cardContact = null;
  }

  openNoteEditor(value: boolean) {
    this.sidePanelNoteService.sidePanel.next(value);
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.korana.nativeElement.scrollTop = this.korana.nativeElement.scrollHeight;
      }, 50);
    }
    catch (err) {
    }
  }

  sendMessage() {
    if (this.messageForm.valid) {
      const formValue = this.messageForm.value;
      const newMessage = {text: formValue.text, user_id: this.user.id, name: this.user.name, created: moment().format()} as Korana;

      this.chatService.sendMessage(newMessage)
        .then(() => {
          this.scrollToBottom();
        });

      this.messageForm.reset();
    }
  }

  //Start Onboarding guide
  startTour() {
    this.onboardingModalRef.close(true);

    const options: JoyrideOptions = {
      steps: ['menu', 'intro@health/diagnostic/add', 'timeline@health/diagnostic/add', 'identity@health/diagnostic/add', 'startDiagnostic@health/diagnostic/add'],
      themeColor: '#26475f',
      waitingTime: 500,
      logsEnabled: false
    };

    this.joyrideService.startTour(options).subscribe(
      (step) => {
      },
      (err) => {
        this.notification.error(null, 'OPERATION_CANCELED');
      },
      () => {
        sessionStorage.setItem('continueOnboarding', 'true');
      }
    );
  }

  switchCompany(companyId) {
    this.settingsCompanyService
      .switch(companyId)
      .toPromise()
      .then((res) => {
        sessionStorage.setItem('session', JSON.stringify(res));
        sessionStorage.setItem('token', res['token']);
        this.getCompanyInfo();
        this.router
          .navigateByUrl(this.sessionService.getDefaultRoute(), {
            skipLocationChange: true,
          });
        this.notification.success(null, 'COMPANY_SWITCHED');
      })
      .catch((err) => this.notification.error(null, err.error));
  }

  switchRole(index: number) {
    this.sessionService.switchRole(index);
    this.session = this.sessionService.getSession();
    this.user = this.session ? this.session.user : {};
    this.activeMenu = this.sessionService.getActiveMenu();
    this.notification.success(null, 'ROLE_SWITCHED')
    this.router.navigate([this.sessionService.getDefaultRoute() || '/dashboard/announcement'])
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) {
          return [];
        }
        else {
          return this.selectContact(term);
        }
      })
    );

  todayFormat = (date): String => {
    return moment().format('l') !== moment(date).format('l') ? 'short' : 'shortTime';
  };

  private getCompanies() {
    this.settingsCompanyService
      .list()
      .toPromise()
      .then((res) => {
        this.companies = _orderBy(
          res.map(item => {
            return {
              id: item.id,
              company_name: item.Settings['general.company_name'],
              enabled: item.enabled
            };
          }),
          ['company_name'],
          ['asc']
        );
      })
      .catch((err) => this.notification.error(null, err.error));
  }

  private getCompanyInfo() {
    const id = this.sessionService.getActiveCompany().id;

    this.settingsCompanyService.getSettings(id)
      .toPromise()
      .then(res => {
        const settings = JSON.stringify({
          tos: res.Settings['general.company_tos'],
          name: res.Settings['general.company_name'],
          email: res.Settings['general.company_email'],
          phone: res.Settings['general.company_phone'],
          seal: res.Settings['general.company_seal'],
          address_1: res.Settings['general.company_address_line_1'],
          address_2: res.Settings['general.company_address_line_2'],
          logo: res.Settings['general.company_logo'],
          signature: res.Settings['general.company_signature'],
          nif: res.Settings['general.company_NIF'],
          stat: res.Settings['general.company_STAT'],
          rcs: res.Settings['general.company_RCS'],
          default_invoice_category: +res.Settings['general.default_invoice_category'],
          default_provider: +res.Settings['general.default_provider'],
          default_men_insurance_item: +res.Settings['general.default_men_insurance_item'],
          default_men_intervention_category: +res.Settings['general.default_men_intervention_category'],
          default_inventory_category: +res.Settings['general.default_inventory_category'],
          default_inventory_out_category: +res.Settings['general.default_inventory_out_category'],
          default_inventory_transfer_category: +res.Settings['general.default_inventory_transfer_category'],
          default_inventory_out_type: res.Settings['general.default_inventory_out_type'],
          default_inventory_order_type: res.Settings['general.default_inventory_order_type'],
          default_inventory_room: +res.Settings['general.default_inventory_room'],
          default_health_category: +res.Settings['general.default_health_category'],
          default_inventory_storage: +res.Settings['general.default_inventory_storage'],
          default_timeline_event_type: res.Settings['general.default_timeline_event_type'],
          default_tracker_category: +res.Settings['general.default_tracker_category'],
          default_bill_inventory_transfer_category: +res.Settings['general.default_bill_inventory_transfer_category'],
          meta: res.Settings['general.company_meta'] ? JSON.parse(res.Settings['general.company_meta']) : {}
        });

        sessionStorage.setItem(SettingsCompanyService.KEY, settings);

        this.loadLogoAndSignature(res.Settings);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getWorldTime() {
    const ctrl = this;
    const xhr = new XMLHttpRequest();

    xhr.responseType = 'json';
    xhr.open('GET', 'https://worldtimeapi.org/api/timezone/Indian/Antananarivo');
    xhr.send();
    xhr.onload = function () {
      const responseObj = xhr.response;
      const currentTime = moment();
      ctrl.worldTime = moment(responseObj.datetime);
      const diff = ctrl.worldTime.diff(currentTime, 'minutes');

      ctrl.isTimeOk = Math.abs(diff) === 0;
    };
  }

  private getPicture(type: string) {
    // Convertir logo en base64 pour les factures, fiche police
    const headers = new HttpHeaders().set(
      'accept',
      'image / webp, image/*,*/ *; q = 0.8'
    );
    const session = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    const id = session[type];
    const _url = [AppService.API, 'static', 'logo', id].join('/');

    this.http
      .get(_url, {headers, responseType: 'arraybuffer'})
      .toPromise()
      .then((res) => {
        const blob = new Blob([res]);
        const reader = new FileReader();

        reader.readAsDataURL(blob);
        reader.onload = function () {
          ImageService[type] = reader.result;
        };
      })
      .catch((err) => {
        if (err.status === 404) {
          this.loadDefaultPhoto();
        }
      });
  }

  private initSearchForm() {
    this.searchForm = this.formBuilder.group({
      contact: null,
      term: null,
    });
  }

  private initMessageForm() {
    this.messageForm = this.formBuilder.group({
      text: '',
    });
  }

  private loadDefaultPhoto() {
    this.imageService.localeImageToBase64('assets/images/p0.jpg', ImageService.logo);
  }

  private loadLogoAndSignature(settings: any) {
    this.getPicture('logo');
    this.getPicture('signature');
    this.logoUrl = this.utilityService.getImageUrl(settings['general.company_logo'], 'LOGO');
    const favIcon: HTMLLinkElement = document.querySelector('#appIcon');
    if (favIcon) {
      favIcon.href = this.logoUrl;
    }
  }

  private toggleLockScreenModal(status: any) {
    const shouldOpen = status;
    this.disposeLock = !shouldOpen;

    if (this.lockObserver && this.lockModal) {
      this.lockObserver.unobserve(this.lockModal);
    }

    if (shouldOpen) {
      this.updateModalRef = this.modalService.open(UpdateLockScreenComponent, {
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        windowClass: 'img-preview update-lock-screen'
      });
      this.updateModalRef.componentInstance.message = status.message;

      this.lockObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting && !this.disposeLock) {
          if (this.lockModal && this.lockModal.isConnected) {
            try {
              this.updateModalRef.close();
            }
            catch (err) {
              console.log(err);
            }
          }
          setTimeout(() => {
            this.toggleLockScreenModal(shouldOpen);
          }, 500);
        }
      }, {threshold: [1]});

      this.lockObserver.observe(this.lockModal);
    }
    else if (this.updateModalRef && this.lockModal && this.lockModal.isConnected) {
      this.updateModalRef.close();
    }
  }

  private get lockModal() {
    try {
      if (!this.updateModalRef || !this.updateModalRef.componentInstance || !this.updateModalRef.componentInstance.elementRef)
        return null;
    }
    catch (e) {
      return null;
    }
    return this.updateModalRef.componentInstance.elementRef.nativeElement as HTMLElement;
  }

  private selectContact(term) {
    return this.contactService.select(term)
      .toPromise()
      .then(res => {
        return res.length > 0 ? res : [null];
      })
      .catch((err) => {
        this.notification.error(null, err.error);
      });
  }

  private themesConfig() {
    this.app = {
      layout: {
        sidePanelOpen: false,
        isMenuOpened: true,
        isMenuCollapsed: false,
        isConversationOpen: false,
        themeConfigOpen: false,
        rtlActived: false,
        searchActived: false,
      },
    };

    this.headerThemes = [
      'header-default',
      'header-primary',
      'header-info',
      'header-success',
      'header-danger',
      'header-dark',
    ];
    this.changeHeader = changeHeader;

    function changeHeader(headerTheme) {
      this.headerSelected = headerTheme;
    }

    this.sidenavThemes = ['sidenav-default', 'side-nav-dark'];
    this.changeSidenav = changeSidenav;

    function changeSidenav(sidenavTheme) {
      this.sidenavSelected = sidenavTheme;
    }
  }

  private loadImage() {
    //  MEN
    if (this.activeMenu.men && this.activeMenu.men.root) {
      this.imageService.localeImageToBase64('assets/images/logo/logo_ministere_education.jpg', 'education');
      this.imageService.localeImageToBase64('assets/images/logo/logo_onapascoma.jpg', 'onapascoma');
      this.imageService.localeImageToBase64('assets/images/logo/logo_republique.jpg', 'republique');
    }
  }
}
