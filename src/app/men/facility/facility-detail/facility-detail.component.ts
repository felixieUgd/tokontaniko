import { Component, OnDestroy, OnInit } from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {ContactService} from 'src/app/contact/contact.service';

import _filter from 'lodash.filter';

import Facility from 'src/app/models/facility';
import {FACILITY_TYPES} from 'src/app/shared/config/men.config';
import {NotificationService} from 'src/app/_services/notification.service';
import {SharedService} from 'src/app/_services/shared.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {MenService} from '../../men.service';
import Request from 'src/app/models/request';
import Contact from 'src/app/models/contact';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';
import Item from 'src/app/models/item';
import {ItemService} from 'src/app/accounting/item/item.service';

@Component({
  selector: 'app-facility-detail',
  templateUrl: './facility-detail.component.html',
  styleUrls: ['./facility-detail.component.css']
})
export class FacilityDetailComponent implements OnInit, OnDestroy {

  facility: Facility;
  form: FormGroup;
  subscription: Subscription;

  facilityTypes: any;
  showInputContact: boolean;
  submitted: boolean;

  insuranceItem: Item;

  selectedCountIndex: number = null;

  constructor(
    public maintenanceService: MaintenanceService,
    public menService: MenService,
    public utilityService: UtilityService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private settingsCompanyService: SettingsCompanyService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private itemService: ItemService,
    private sharedService: SharedService
  ) { }

  get StudentCounts() {
    return this.form.get('StudentCounts') as FormArray;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    this.facilityTypes = FACILITY_TYPES;

    this.initForm();
    this.setup(+id);
    this.subscribe();
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  deleteAttachment(docId) {
    this.menService.deleteAttachment(this.facility.id, docId)
      .then((facility) => {
        this.facility.attachments = facility.attachments;
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.message));
  }

  displayContact(contacts: Contact[]) {
    let str_contact = '';

    contacts.forEach((item, index) => {
      str_contact += item.name;
      if (index < contacts.length - 1) {
        str_contact += ', ';
      }
    });

    return str_contact;
  }

  @Confirmable({title: 'Retirer le contact'})
  dropContact(index) {
    this.showInputContact = true;
    this.facility.Contacts.splice(index, 1);
    this.updateContact();
  }

  getFacility(id) {
    this.facility = null;

    this.menService.get(id)
      .then(res => {
        while (this.StudentCounts.length) {
          this.StudentCounts.removeAt(0);
        }

        res.Requests.sort((a, b) => b.id - a.id);

        this.form.patchValue({
          ...res,
          address: res.meta && !res.meta.length? res.meta.address: null
        });

        this.facility = Object.assign({}, res, {
          Requests: res.Requests.reduce((requests, current) => {
            if (current.type === 'INSURANCE') {
              const req = {
                ...current,
                meta: {
                  student_count: null,
                  ...current.meta
                }
              };

              requests.push(req);

              this.StudentCounts.push(this.formBuilder.group({
                Request: req,
                student_count: req.meta.student_count
              }));
            }

            return requests;
          }, []),
          Invoices: this.flattenInvoices(res.Requests),
          Claim: _filter(res.Requests, ['type', 'CLAIM'])
            .map(item => Object.assign({}, item, {
              Student: this.menService.getContactByType(item.Contacts, 'STUDENT')
            }))
        });
      })
      .catch(err => this.notification.error(null, err.error));
  }

  setup(id: number) {
    const insuranceItemId = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_insurance_item');
    if (insuranceItemId && !isNaN(+insuranceItemId)) {
      this.itemService.get(+insuranceItemId).toPromise().then(item => {
        this.insuranceItem = item;
        this.getFacility(id);
      }).catch(err => {
        this.notification.error(null, err.error);
      })
    }
    else {
      this.getFacility(id);
    }
  }

  onSelectContact = (event): void => {
    if (event) {
      this.facility.Contacts.push(event);
      this.updateContact();
    }
    else {
      this.sharedService.newContact(null);
      this.sharedService.updateSidePanel(true);
    }
  }

  searchContact = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(1600),
      distinctUntilChanged(),
      switchMap(term => term.length < 3 ? [] :
        this.contactService.select(term)
          .toPromise()
          .then(res => {
            return res.length > 0 ? res : [null];
          })
          .catch(err => this.notification.error(null, err.error))
      )
    )

  toggleEditStudentCount(index: number) {
    if (this.selectedCountIndex === index) {
      const value = this.StudentCounts.at(index).value;
      if (value.student_count != null) {
        const params = {
          id: value.Request.id,
          description: 'Modification d\'effectif: ' + value.student_count
        };

        this.maintenanceService.addHistory(params).toPromise().then((note) => {
          return this.maintenanceService.update({
            id: value.Request.id,
            meta: {
              ...value.Request.meta,
              student_count: value.student_count
            }
          })
          .toPromise()
          .then(() => {
            this.selectedCountIndex = null;
            const request = this.facility.Requests[index];
            request.meta.student_count = value.student_count;
            request.RequestHistories.push(note);
            this.resetStudentCount(index);
            this.facility.Invoices = this.flattenInvoices(this.facility.Requests);
            this.notification.success(null, 'UPDATE_SUCCESS');
          });
        }).catch(err => this.notification.error(null, err.error));
      }
      else {
        this.notification.error(null, 'INPUT_NOT_VALID');
      }
    }
    else {
      if (this.selectedCountIndex !== null) {
        this.resetStudentCount(this.selectedCountIndex);
      }
      this.selectedCountIndex = index;
    }
  }

  update() {
    this.submitted = true;

    if(this.form.valid) {
      const formValue = this.form.getRawValue();
      const body = Object.assign({}, formValue, {
        name: this.facility.name,
        Contacts: this.facility.Contacts
      });

      if ((this.facility.meta && this.facility.meta.length) || !this.facility.meta) {
        this.facility.meta = {};
      }

      body.meta = {
        ...this.facility.meta,
        address: body.address
      };

      delete body.facility_type_id;
      delete body.contact;
      delete body.StudentCounts;
      delete body.address;

      this.menService.update(this.facility.id, body)
        .then(res => {
          this.refresh();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          console.log(err);
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateContact() {
    this.menService.updateContact(this.facility.id, {Contacts: this.facility.Contacts})
      .then(res => {
        this.refresh();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private flattenInvoices(requests: Request[]) {
    let invoices = [];

    requests.forEach(item => {
      item.Invoices.forEach(invoice => {
        invoice.Request = item;
        invoices.push(invoice);
      })
    });

    return invoices;
  }

  private initForm() {
    this.form = this.formBuilder.group({
      address: null,
      contact: null,
      facility_type_id: null,
      is_enabled: true,
      is_private: false,
      StudentCounts: this.formBuilder.array([])
    });
  }

  refresh() {
    this.form.reset({
      is_enabled: true,
      is_private: false
    });
    this.submitted = false;
    this.showInputContact = false;

    this.getFacility(this.facility.id);
  }

  private resetStudentCount(index: number) {
    const request = this.facility.Requests[index];
    this.StudentCounts.at(index).patchValue({
      student_count: request && request.meta? request.meta.student_count: null
    });
  }

  private subscribe() {
    this.subscription = this.sharedService.contact$.subscribe(contact => {
      if (contact) {
        this.facility.Contacts.push(contact);
        this.updateContact();
      }
    });
  }

}
