import {Component, OnInit} from '@angular/core';
import {concat, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup} from '@angular/forms';

import * as moment from 'moment';
import Bill from 'src/app/models/bill';
import Category from 'src/app/models/category';
import Request from 'src/app/models/request';
import Tax from 'src/app/models/tax';

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BillAddModalComponent} from 'src/app/men/bill/bill-add-modal/bill-add-modal.component';
import {FileUploader} from 'ng2-file-upload';

import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {UserService} from 'src/app/settings/user/user.service';
import Contact from 'src/app/models/contact';
import {AppService} from 'src/app/app.service';
import {ContactService} from 'src/app/contact/contact.service';
import {MenContactType, MenService} from '../../men.service';
import {PrintService} from 'src/app/_services/print.service';
import {TranslateService} from '@ngx-translate/core';
import {BillService} from 'src/app/expense/bill/bill.service';

@Component({
  selector: 'app-men-claim-detail',
  templateUrl: './men-claim-detail.component.html',
  styleUrls: ['./men-claim-detail.component.css']
})
export class MenClaimDetailComponent implements OnInit {
  staffInput$ = new Subject<string>();

  bill: Bill;
  categories: Category[];
  claim: Request = new Request({});
  form: FormGroup;
  taxes: Tax[];
  uploader: FileUploader;
  warrants: Contact[];
  RequestContacts = {
    Father: null,
    Mother: null,
    Officer: null,
    Student: null,
    Tutor: null,
    Warrant: null,
    Witness: null
  };

  doc_name: string;
  submitted: boolean;

  constructor(
    public appService: AppService,
    private billService: BillService,
    public utilityService: UtilityService,
    private activatedRoute: ActivatedRoute,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private maintenanceService: MaintenanceService,
    private menService: MenService,
    private ngbModal: NgbModal,
    private notification: NotificationService,
    private printService: PrintService,
    private translateService: TranslateService,
    private userService: UserService
  ) { }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    this.initForm();
    this.getRequest(id);
  }

  bgColor = (status) => this.utilityService.statusStyle(status).background;

  deleteAttachment(docId) {
    this.maintenanceService.deleteAttachment(this.claim.id, docId)
      .then(() => {
        this.resetForm();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.message));
  }

  displayItems = (item) => {
    let description = '';

    if (item['status_code'] === 'ADD' || item['status_code'] === 'REMOVE' || item['status_code'] === 'REMOVED') {
      const items = JSON.parse(item.description);

      for (let i = 0; i < items.length; i++) {
        description += items[i].name + ' (' + items[i].quantity + ')';

        if (items.length > 1 && (i + 1) < items.length) {
          description += ' - ';
        }
      }
    }
    else {
      description = item.description;
    }

    return description;
  };

  addBill() {
    const modalRef = this.ngbModal.open(BillAddModalComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
      windowClass: 'modal-xl'
    });

    modalRef.componentInstance.data = this.claim;

    modalRef.result.then(res => {
      if (res) {
        this.updateRequest();
      }
    }, err => {
      console.log('dismissed!');
    });
  }

  editWarrant(contact) {
    this.RequestContacts.Warrant = contact;
  }

  getAge(str_dob) {
    return this.utilityService.getAge(str_dob);
  }

  staff$ = concat(
    of([]),
    this.staffInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.userService.select(term, 'selectByCompany')
        .then(res => {
          return res.length > 0 ? res : [null];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  onAddStaff(event) {
    if (event.id) {
      this.maintenanceService.updateBy(this.claim.id, {staff_id: event.id}, 'staff')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else console.log('User not found!');
  }

  onRemoveContact(event) {
    this.maintenanceService.removeBy(this.claim.id, 'contact', event.value.id)
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  onRemoveStaff(event) {
    this.maintenanceService.removeBy(this.claim.id, 'staff', event.value.id)
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  print(selectedBill: Bill) {
    // TODO: Check permission print
    if (selectedBill.status === 'PAID') {
      this.printService.invoiceClaim(this.claim, selectedBill);
      this.addHistory(selectedBill);
    }
  }

  resetForm() {
    this.doc_name = null;
    this.submitted = false;
    this.RequestContacts.Father = null;
    this.RequestContacts.Mother = null;
    this.RequestContacts.Officer = null;
    this.RequestContacts.Student = null;
    this.RequestContacts.Tutor = null;
    this.RequestContacts.Warrant = null;
    this.RequestContacts.Witness = null;

    this.form.reset();
    this.getRequest(this.claim.id);
  }

  updateContact(contact:Contact, type?:string) {
    if (contact) {
      const body:any = {
        contact_id: contact.id
      };

      if (type) body.meta = {type};

      this.maintenanceService.updateBy(this.claim.id, body, 'contact')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          console.log(err);
          this.notification.error(null, err.error);
        });
    }
    else console.log('Contact selected: None!');
  }

  updateContactInfo(contact:Contact) {
    if (contact) {
      this.contactService.update(contact)
        .toPromise()
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          console.log(err);
          this.notification.error(null, err.error)
        });
    }
    else console.log('Contact selected: None!');
  }

  updateRequest() {
    this.submitted = true;

    if (this.form.valid) {
      const body:any = this.claim;
      const event_time = this.claim.event_start ? (this.claim.event_start).split(':') : null;

      body.event_start = event_time ? moment().set({hours: +event_time[0], minutes: +event_time[1]}).format() : null;

      this.maintenanceService.update(body)
        .toPromise()
        .then(() => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(err, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateStatus(status) {
    const params = {
      id: this.claim.id,
      status: status
    };

    this.maintenanceService.updateStatus(params)
      .toPromise()
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private addHistory(bill: Bill): void {
    const translation = this.translateService.instant('common.PRINT_INVOICE');
    const params = {
      id: bill.id,
      description: translation,
      status_code: 'PRINT'
    };

    this.billService.addHistory(params)
      .toPromise()
      .then(res => this.resetForm())
      .catch(err => this.notification.error(null, err.error));
  }

  private getRequest(id) {
    this.claim = null;

    this.maintenanceService.get(id)
      .toPromise()
      .then(res => {
        this.RequestContacts.Father = this.menService.getContactByType(res.Contacts, MenContactType.FATHER);
        this.RequestContacts.Mother = this.menService.getContactByType(res.Contacts, MenContactType.MOTHER);
        this.RequestContacts.Officer = this.menService.getContactByType(res.Contacts, MenContactType.OFFICER);
        this.RequestContacts.Student = this.menService.getContactByType(res.Contacts, MenContactType.STUDENT);
        this.RequestContacts.Tutor = this.menService.getContactByType(res.Contacts, MenContactType.TUTOR);
        this.RequestContacts.Witness = this.menService.getContactByType(res.Contacts, MenContactType.WITNESS);
        this.warrants = this.menService.getWarrants(res.Contacts, MenContactType.WARRANT);

        this.claim = Object.assign({}, res, {
          requested_at: res.requested_at ? moment(res.requested_at).toDate() : null,
          event_start: res.event_start ? moment(res.event_start).format('HH:mm') : null,
          RequestContacts: Object.assign({}, this.RequestContacts, {Warrant: this.warrants[0]})
        });

        this.claim.meta.Accident.delivered_at = moment(this.claim.meta.Accident.delivered_at).toDate();

        this.form.patchValue({
          contact: res.Contacts,
          staff: res.Staffs
        });
      })
      .catch(err => {
        console.log(err);
        this.notification.error(null, err.error);
      });
  }

  private initForm() {
    this.submitted = false
    this.form = this.formBuilder.group({
      contact: null,
      staff: null
    });
  }
}
