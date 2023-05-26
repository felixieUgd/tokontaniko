import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {Subscription} from 'rxjs';

import {FileUploader} from 'ng2-file-upload';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment';
import _forEach from 'lodash.foreach';
import _orderBy from 'lodash.orderby';
import _map from 'lodash.map';
import {ChartOptions} from 'chart.js';

import {ContactPreviewComponent} from '../contact-preview/contact-preview.component';
import {environment} from 'src/environments/environment';

import Account from 'src/app/models/account';
import Contact from 'src/app/models/contact';
import Revenue from 'src/app/models/revenue';
import Reward from 'src/app/models/reward';
import Tax from 'src/app/models/tax';

import {ThemeConstants} from 'src/app/shared/config/theme-constant';

import {AccountService} from 'src/app/accounting/account/account.service';
import {AppService} from 'src/app/app.service';
import {ContactService} from '../contact.service';
import {CountryService} from 'src/app/_services/country.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SessionService} from 'src/app/_services/session.service';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import {UtilityService} from 'src/app/_services/utility.service';

const API_BOX = environment.apiBox;

@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.component.html',
  styleUrls: ['./contact-detail.component.css', '../../../assets/scss/plugins/_datepicker.scss']
})
export class ContactDetailComponent implements OnInit, OnDestroy {
  private id;

  contact: Contact;
  dateForm: FormGroup;
  profileForm: FormGroup;
  rewards: Reward[];
  subscription: Subscription;
  uploader: FileUploader;
  taxes: Tax[];

  activeMenu: any;
  itemSummary: any;
  submitted: boolean;
  submitted_summary: boolean;
  submitted_account: boolean;
  summary: any;

  completionRate = 0;
  invoices = [];
  maxDate;
  minDate;

  selectedAccount: Account;
  accountForm: FormGroup;
  sidePanelOpen: boolean;

  constructor(
    private appService: AppService,
    private colorConfig: ThemeConstants,
    private contactService: ContactService,
    private countryService: CountryService,
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private modalService: NgbModal,
    private notification: NotificationService,
    private printService: PrintService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private taxService: TaxService,
    private utilityService: UtilityService
  ) {

    this.subscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        this.id = this.route.snapshot.paramMap.get('id');

        this.resetAll();
      }
    });
  }

  ngOnInit() {
    const user = this.sessionService.getUser();

    this.activeMenu = user.activeMenu && user.activeMenu.length ? user.activeMenu[0] : {};
    this.contact = null;
    this.id = this.route.snapshot.paramMap.get('id');
    this.maxDate = this.appService.getMaxDate();
    this.minDate = this.appService.getMinDate();
    this.submitted = false;

    this.initDateForm();
    this.initProfileForm();
    this.initAccountForm();
    this.getTaxes();
  }

  checkVerificationCode() {
    const code = this.profileForm.get('verification_code').value;
    const id = this.contact.id;

    this.contactService.checkVerificationCode(id, {code})
      .then(res => {
        this.resetAll();
        this.notification.success(null, 'SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  closeAccountSidepanel() {
    this.sidePanelOpen = false;
    this.selectedAccount = null;
  }

  copy = (elem: HTMLElement) => this.utilityService.copyToClipboard(elem.title);

  deleteAttachment(docId) {
    this.contactService.deleteAttachment(this.id, docId)
      .then(() => {
        this.resetAll();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.message));
  }

  onDetectError = err => console.log('Error: ', err);

  editAccount(id: number) {
    this.accountService.get(id).toPromise().then(selected => {
      this.openAccountSidePanel();
      this.selectedAccount = selected;
      this.accountForm.reset(selected);
    }).catch(err => this.notification.error(null, err.error));
  }

  getDuration = (str_date_in: string, str_date_out: string): number => {
    return Math.ceil(moment(str_date_out).diff(moment(str_date_in), 'days', true));
  };

  getItemSummary() {
    this.contactService.itemSummary(this.id)
      .then(res => {
        this.itemSummary = {
          goodsSummary: _orderBy(res.goodsSummary, ['count'], ['desc']),
          servicesSummary: _orderBy(res.servicesSummary, ['count'], ['desc'])
        };
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  openAccountSidePanel() {
    this.selectedAccount = null;
    this.sidePanelOpen = true;
    this.accountForm.reset({
      enabled: true
    });
  }

  preview(idPhoto, type?: string) {
    if (idPhoto) {
      const modalRef = this.modalService.open(ContactPreviewComponent, {size: 'lg', windowClass: 'img-preview'});
      modalRef.componentInstance.idPhoto = idPhoto;
      modalRef.componentInstance.type = type ? type : 'documents';
    }
    else {
      this.notification.warning(null, 'FILE_NOT_FOUND');
    }
  }

  printCard() {
    this.printService.customerCard(this.contact);
  }

  resetDateForm() {
    this.dateForm.reset();
  }

  saveAccount() {
    this.submitted_account = false;
    if (this.accountForm.valid) {
      const formValue = this.accountForm.getRawValue();
      if (this.selectedAccount) {
        const account = new Account({...formValue, id: this.selectedAccount.id});
        this.accountService.update(account).toPromise().then(() => {
          this.closeAccountSidepanel();
          this.notification.success(null, 'UPDATE_SUCCESS');
          this.getContact(this.id);
        }).catch(err => this.notification.error(null, err.error));
      }
      else {
        const account = new Account({...formValue, currency_code: 'MGA', contact_id: +this.id});
        this.accountService.create(account).toPromise().then(() => {
          this.closeAccountSidepanel();
          this.notification.success(null, 'SAVE_SUCCESS');
          this.getContact(this.id);
        }).catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  sendVerificationCode() {
    const id = this.contact.id;

    this.contactService.sendVerificationCode(id)
      .then(res => {
        this.resetAll();
        this.notification.success(null, 'VERIFICATION_CODE_SENT');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  setTax() {
    const values: any[] = this.profileForm.get('tax').value;

    if (values && values.length) {
      const body = values.map(item => {
        return {id: item.id};
      });

      this.contactService.setTax(this.id, {Taxes: body})
        .then(res => {
          this.resetAll();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
  }

  totalRevenues(revenues: Revenue[]) {
    let total = 0;

    revenues.forEach(revenue => total += revenue.amount);

    return total;
  }

  uploadPhoto() {
    this.uploader = new FileUploader({
      url: this.utilityService.getUploadUrl(this.id, 'CONTACT'),
      method: 'POST',
      headers: [
        {name: 'X-Access-Token', value: this.sessionService.getToken()}
      ],
      autoUpload: true
    });

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader.onSuccessItem = (file, response, status, header) => {
      this.resetAll();
      this.notification.success(null, 'UPLOAD_SUCCESS');
    };
  }

  updateProfile() {
    this.submitted = true;
    const keys = Object.keys(this.profileForm.controls);
    keys.forEach(key => {
      if (this.profileForm.controls[key].invalid) {
        console.log(key, this.profileForm.controls[key]);
      }
    });

    if (this.profileForm.valid) {
      const formValue = this.profileForm.getRawValue();
      const _dob = moment(formValue.bio_dob);
      const meta = Object.assign({}, formValue.meta, {
        school_grade: formValue.school_grade,
        school_serial: formValue.school_serial,
        school_insurance: formValue.school_insurance,
        parent_2: formValue.parent_2 ? {
          id: formValue.parent_2.id,
          name: formValue.parent_2.name,
          address: formValue.parent_address
        } : null,
        tutor: formValue.tutor ? {
          id: formValue.tutor.id,
          name: formValue.tutor.name,
          address: formValue.tutor_address
        } : null
      });

      delete formValue.parent_address;
      delete formValue.parent_2;
      delete formValue.tutor;
      delete formValue.tutor_address;
      delete formValue.school_grade;
      delete formValue.school_serial;
      delete formValue.school_insurance;

      const body: any = new Contact(Object.assign({}, formValue, {
        parent_id: formValue.parent_1 ? formValue.parent_1.id : null,
        phone: formValue.phone.number,
        bio_dob: _dob.isValid() ? _dob.format() : null,
        meta
      }));

      delete body.parent_1;

      this.contactService.update(body)
        .toPromise()
        .then(res => {
          this.resetAll();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private getContact(id: string) {
    this.contactService.get(id)
      .toPromise()
      .then(res => {
        this.contact = res;
        this.completionRate = this.getCompletionRate(res);

        const value: any = Object.assign({}, res, {
          parent_1: res.parent_id ? res.Parent : null,
          phone: {
            country: this.countryService.getCountryByPhoneNumber(res.phone),
            number: res.phone
          },
          bio_dob: res.bio_dob ? new Date(res.bio_dob) : null,
          meta: {},
          tax: res.Taxes
        });

        if (res.meta) {
          value.meta = Object.assign({}, res.meta, {
            id_cin_issued_date: res.meta.id_cin_issued_date ? new Date(res.meta.id_cin_issued_date) : null
          });
          value.school_grade = res.meta.school_grade || null;
          value.school_serial = res.meta.school_serial || null;
          value.school_insurance = res.meta.school_insurance || null;
          value.parent_2 = res.meta.parent_2 || null;
          value.parent_address = res.meta.parent_2 ? res.meta.parent_2.address : null;
          value.tutor = res.meta.tutor || null;
          value.tutor_address = res.meta.tutor ? res.meta.tutor.address : null;
        }

        this.profileForm.patchValue(value);
        this.getOverview(res.id);
        this.getRewards(res);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getCompletionRate(contact: Contact) {
    return this.contactService.getCompletionRate(contact);
  }

  private getOverview(id: number) {
    this.contactService.getOverview(id)
      .then(res => {
        if (res) {
          const mapped = res.Taxes.map(item => {
            return {
              id: item.ContactTaxes.tax_id,
              name: item.name
            }
          });

          this.profileForm.patchValue({tax: mapped});
        }
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getRewards(contact: Contact) {
    this.contactService.getRewards()
      .toPromise()
      .then(res => {
        this.rewards = _orderBy(res, ['points_threshold'], ['desc']);
        this.contact.Reward = this.contactService.getCustomerReward(this.rewards, contact);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initAccountForm() {
    this.submitted_account = false;
    this.accountForm = this.formBuilder.group({
      name: [null, Validators.required],
      number: [null, Validators.required],
      card_uid: null,
      enabled: true
    });
  }

  private initDateForm() {
    this.submitted_summary = false;
    this.dateForm = this.formBuilder.group({
      start: [null, Validators.required],
      end: [null, Validators.required]
    });
  }

  private initProfileForm() {
    this.profileForm = this.formBuilder.group({
      enabled: false,
      id: null,
      name: [null, Validators.required],
      phone: null,
      email: [null, Validators.email],
      sex: null,
      bio_dob: null,
      bio_nationality: null,
      bio_pob: null,
      address: null,
      occupation: null,
      id_cin: null,
      id_passport: null,
      id_driver_license: null,
      id_other: null,
      is_business: false,
      doc_name: null,
      note: null,
      meta: this.formBuilder.group({
        id_cin_issued_date: null,
        name: null,
        phone: null,
        address: null,
        nif: null,
        stat: null,
        rcs: null,
      }),
      photo: null,
      tax: null,
      verification_code: null,
      verified: null,
      //  Other
      parent_1: null, //  Father
      parent_2: null, //  Mother
      parent_address: null,
      tutor: null,    //  Tuteur
      tutor_address: null,
      //  Student,
      school_grade: null,
      school_serial: null,
      school_insurance: null, //  N° facture
    });
  }

  resetAll() {
    this.submitted = false;
    this.submitted_summary = false;
    this.submitted_account = false;
    this.uploader = null;
    this.selectedAccount = null;

    if (this.profileForm) {
      this.profileForm.reset();
    }

    if (this.dateForm) {
      this.dateForm.reset();
    }

    this.getItemSummary();
    this.getContact(this.id);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private getTaxes() {
    this.taxService.list()
      .toPromise()
      .then(res => this.taxes = res)
      .catch(err => this.notification.error(null, err.error));
  }
}
