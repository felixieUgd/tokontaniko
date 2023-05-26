import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, concat, Observable, of, Subject, Subscription} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';

import {FileUploader} from 'ng2-file-upload';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import Category from 'src/app/models/category';
import Request, {RequestStatus, RequestType} from 'src/app/models/request';
import User from 'src/app/models/user';

import {BillAddModalComponent} from 'src/app/men/bill/bill-add-modal/bill-add-modal.component';
import {ContactPreviewComponent} from 'src/app/contact/contact-preview/contact-preview.component';
import {MenInvoiceAddModalComponent} from '../../invoice/add-modal/men-invoice-add-modal.component';

import {CategoryService} from 'src/app/accounting/category/category.service';
import {ContactService} from 'src/app/contact/contact.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SharedService} from 'src/app/_services/shared.service';
import {UserService} from 'src/app/settings/user/user.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';
import Item from 'src/app/models/item';
import {ItemService} from 'src/app/accounting/item/item.service';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.css']
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  contactInput$ = new BehaviorSubject<string>('');
  staffInput$ = new Subject<string>();

  categories: Observable<Category[]>;
  form: FormGroup;
  requestStatuses: Array<RequestStatus>;
  subscription = new Subscription();
  ticket: Request;
  uploader: FileUploader;
  users: User[];
  requestTypes: Observable<RequestType[]>;

  id;
  doc_name;
  searchItem;
  submitted: boolean;
  submitted_item: boolean;

  insuranceItem: Item;

  constructor(
    public utilityService: UtilityService,
    private activatedRoute: ActivatedRoute,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private maintenanceService: MaintenanceService,
    private modalService: NgbModal,
    private ngbModal: NgbModal,
    private notification: NotificationService,
    private printService: PrintService,
    private itemService: ItemService,
    private settingsCompanyService: SettingsCompanyService,
    private sharedService: SharedService,
    private userService: UserService) {
  }

  ngOnInit() {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    const interventionCategory = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_intervention_category');
    this.requestTypes = this.maintenanceService.getTypes({type: 'all'}, interventionCategory);
    this.categories = this.categoryService.list({type: 'maintenance'});

    this.initForm();
    this.setup();
    this.getStatuses();
    this.subscribe();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  addBill() {
    const modalRef = this.ngbModal.open(BillAddModalComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
      windowClass: 'modal-xl'
    });

    modalRef.componentInstance.data = this.ticket;

    modalRef.result.then(res => {
      if (res) this.resetForm();
    }, err => {
      console.log('dismissed!');
    });
  }

  addInvoice() {
    const modalRef = this.ngbModal.open(MenInvoiceAddModalComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
      windowClass: 'modal-xl'
    });

    modalRef.componentInstance.data = this.ticket;

    modalRef.result.then(res => {
      if (res) this.updateStatus('IN_PROGRESS');
    }, err => {
      console.log('dismissed!');
    });
  }

  deleteAttachment(docId) {
    this.maintenanceService.deleteAttachment(this.id, docId)
      .then(() => {
        this.resetForm();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.message));
  }

  formatter = (x: string) => x;

  onAddContact(event) {
    if (event.id) {
      this.addContact(event.id);
    }
    else {
      const contactField = this.form.get('contact') as FormControl;
      contactField.setValue(this.ticket.Contacts);

      const contact = this.contactInput$.getValue();
      this.sharedService.updateSidePanel(true);
      this.sharedService.newContact(isNaN(+(contact.replace(/\s/g, ''))) ? {name: contact} : {phone: contact}); // autofill sidepanel based on input
    }
  }

  onAddStaff(event) {
    if (event.id) {
      this.maintenanceService.updateBy(this.ticket.id, {staff_id: event.id}, 'staff')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else console.log('User not found!');
  }

  @Confirmable({title: 'Retirer le contact'}, true)
  onRemoveContact(event, response?: any) {
    if (response) {
      this.maintenanceService.removeBy(this.ticket.id, 'contact', event.id)
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.form.get('contact').setValue(this.ticket.Contacts);
    }
  }

  @Confirmable({title: 'Retirer l\'utilisateur'}, true)
  onRemoveStaff(event, response?: any) {
    if (response) {
      this.maintenanceService.removeBy(this.ticket.id, 'staff', event.value.id)
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.form.get('staff').setValue(this.ticket.Staffs);
    }
  }

  onSelectStatus(event) {
    if (event) this.setExtendedStatus(event.id);
    else this.setExtendedStatus(null);
  }

  onSelectItem = (event, item) => {
    event.preventDefault();

    item.patchValue({
      item_id: event.item.id,
      item_type: event.item.type,
      price: event.item.sale_price,
      name: event.item.name,
      sku: event.item.sku
    });
  }

  onSelectType(event) {
    if (event.id) {
      this.maintenanceService.updateExtendedBy(this.ticket.id, {request_type_id: event.id}, 'type')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
  }

  previewDoc(idPhoto, type?: string) {
    if (idPhoto) {
      const modalRef = this.modalService.open(ContactPreviewComponent, {size: 'lg', windowClass: 'img-preview'});
      modalRef.componentInstance.idPhoto = idPhoto;
      modalRef.componentInstance.type = type ? type : 'documents';
    }
    else {
      this.notification.warning(null, 'FILE_NOT_FOUND');
    }
  }

  print() {
    this.printService.request(this.ticket);
  }

  sendSMS() {
    this.maintenanceService.sendSMS(this.id)
      .then(() => {
        this.resetForm();
        this.notification.success(null, 'SMS_SENT');
      })
      .catch(err => this.notification.error(null, err.message));
  }

  setExtendedStatus(statusId: number) {
    this.maintenanceService.updateExtendedBy(this.ticket.id, {request_status_id: statusId}, 'status')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
  }

  subscribe() {
    this.subscription.add(this.sharedService.contact$.subscribe(contact => {
      if (contact) {
        this.addContact(contact.id);
      }
    }));
  }

  updateRequest() {
    this.submitted = true;

    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const body: any = Object.assign({}, formValue, {
        id: this.id,
        staff_id: formValue.staff ? formValue.staff.id : null,
        staff_name: formValue.staff ? formValue.staff.name : null,
        meta: {
          ...this.ticket.meta,
          student_count: formValue.student_count
        }
      });

      delete body.student_count;

      let addCountHistory = false;
      if (!this.ticket.meta || isNaN(+this.ticket.meta.student_count)) {
        addCountHistory = !isNaN(+body.meta.student_count);
      }
      else {
        addCountHistory = this.ticket.meta.student_count !== body.meta.student_count;
      }

      let observable: Observable<any> = null;

      if (addCountHistory) {
        const params = {
          id: this.ticket.id,
          description: 'Modification d\'effectif: ' + (body.meta.student_count || '-')
        };
        observable = this.maintenanceService.addHistory(params).pipe(
          map(() => {
            return this.ticket.id;
          })
        );
      }
      else {
        observable = of(true);
      }

      delete body.extended_status;
      delete body.extended_type;

      return this.maintenanceService.update(body)
        .pipe(
          switchMap(() => {
            return observable;
          })
        )
        .toPromise()
        .then(() => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        }).catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateStatus(status) {
    const params = {
      id: this.id,
      status: status
    };
    let isValid = true;

    if (status === 'COMPLETED' && this.ticket.Invoices.length > 0) {
      const res = this.ticket.Invoices.filter(item => !/PAID|CANCELED|VOIDED/.test(item.status));

      if (res.length > 0) isValid = false;
    }

    //  Can't complete invoice not PAID
    if (!isValid) {
      this.notification.error(null, 'INVOICE_NOT_PAID');
    }
    else {
      this.maintenanceService.updateStatus(params)
        .toPromise()
        .then(() => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
  }

  contact$ = concat(
    of([]),
    this.contactInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.contactService.select(term)
        .toPromise()
        .then(res => {
          return res.length > 0 ? res : [{id: 0, name: 'Ajouter'}];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  staff$ = concat(
    of([]),
    this.staffInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.userService.select(term, 'selectByCompany')
        .then(res => {
          return res;
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  private addContact(id: number) {
    this.maintenanceService.updateBy(this.ticket.id, {contact_id: id}, 'contact')
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getRequest(id) {
    this.maintenanceService.get(id)
      .toPromise()
      .then(res => {
        this.ticket = new Request(res);

        this.form.patchValue(Object.assign({}, res, {
          contact: res.Contacts,
          extended_status: res.RequestStatus,
          extended_type: res.RequestType,
          staff: res.Staffs,
          due_at: res.due_at ? new Date(res.due_at) : null,
          requested_at: res.requested_at ? new Date(res.requested_at) : null,
          student_count: res.meta ? res.meta.student_count : null
        }));
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getStatuses() {
    const interventionCategory = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_intervention_category');
    this.maintenanceService.listStatus(interventionCategory)
      .toPromise()
      .then(res => this.requestStatuses = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.form = this.formBuilder.group({
      category_id: [null, Validators.required],
      comments: null,
      contact: null,
      description: [null, Validators.required],
      extended_status: null,
      extended_type: null,
      order_number: null,
      requested_at: null,
      student_count: null,
      staff: [null, Validators.required],
      status: null,
      title: [null, Validators.required]
    });
  }

  private setup() {
    const insuranceItemId = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_insurance_item');
    if (insuranceItemId && !isNaN(+insuranceItemId)) {
      this.itemService.get(+insuranceItemId).toPromise().then(item => {
        this.insuranceItem = item;
        this.getRequest(this.id);
      }).catch(err => {
        this.notification.error(null, err.error);
      })
    }
    else {
      this.getRequest(this.id);
    }
  } 

  resetForm() {
    this.doc_name = null;
    this.ticket = null;
    this.submitted = false;
    this.submitted_item = false;
    this.uploader = null;

    this.form.reset();
    this.getRequest(this.id);
  }
}
