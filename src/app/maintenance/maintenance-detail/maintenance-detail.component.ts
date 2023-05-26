import {AfterViewInit, Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output} from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormArray} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {concat, Observable, of, Subject, Subscription, throwError} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {FileUploader} from 'ng2-file-upload';

import {CategoryService} from 'src/app/accounting/category/category.service';
import {ContactService} from 'src/app/contact/contact.service';
import {RoomService} from 'src/app/_services/room.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {ItemService} from 'src/app/accounting/item/item.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SessionService} from 'src/app/_services/session.service';
import {SharedService} from 'src/app/_services/shared.service';
import {UserService} from 'src/app/settings/user/user.service';

import Category from 'src/app/models/category';
import Request, {RequestStatus, RequestType} from 'src/app/models/request';
import Room from 'src/app/models/room';
import User from 'src/app/models/user';

import * as moment from 'moment';
import {UtilityService} from 'src/app/_services/utility.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {AppendItemModalComponent} from 'src/app/ui-elements/modals/append-item-modal/append-item-modal.component';
import Item, {ItemUnit} from 'src/app/models/item';
import {InventoryService} from 'src/app/inventory/inventory.service';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';

declare var $: any; // JQuery

@Component({
  selector: 'app-maintenance-detail',
  templateUrl: './maintenance-detail.component.html',
  styleUrls: ['./maintenance-detail.component.css', '../../../assets/scss/plugins/_datepicker.scss']
})
export class MaintenanceDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  contactInput$ = new Subject<string>();
  staffInput$ = new Subject<string>();

  @Input()
  isModal: boolean = false;
  @Output()
  statusChange = new EventEmitter<string>();

  categories: Category[];
  categories$: Observable<Category[]>;
  facilities: Room[];
  itemForm: FormGroup;
  requestForm: FormGroup;
  request: Request;
  requestStatuses: Array<RequestStatus>;
  types: Observable<RequestType[]>;
  uploader: FileUploader;
  users: User[];

  items: Item[] = [];
  subscription = new Subscription();
  units: ItemUnit[] = [];

  activeMenu: any;
  config: any;
  id: number;
  doc_name: string;
  needReload: boolean;
  searchItem;
  submitted: boolean;
  submitted_item: boolean;

  constructor(
    public modalService: NgbModal,
    public maintenanceService: MaintenanceService,
    private router: Router,
    private ngZone: NgZone,
    private activatedRoute: ActivatedRoute,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private roomService: RoomService,
    private invoiceService: InvoiceService,
    private itemService: ItemService,
    private notification: NotificationService,
    private printService: PrintService,
    private sessionService: SessionService,
    private inventoryService: InventoryService,
    private sharedService: SharedService,
    private userService: UserService,
    private utilityService: UtilityService
  ) {
    this.config = {
      placeholder: '',
      tabsize: 2,
      height: '265px',
      toolbar: [
        ['font', ['bold', 'italic', 'underline', 'strikethrough']],
        ['fontsize', ['fontsize', 'color']],
        ['para', ['ul']]
      ],
      fontNames: ['Helvetica', 'Arial']
    };
  }

  ngOnInit() {
    if (!this.isModal) {
      const params = this.activatedRoute.snapshot.paramMap;
      this.id = +params.get('id');
    }

    this.types = this.maintenanceService.getTypes({type: 'all'}).pipe(
      catchError(err => {
        this.notification.error(null, err.error);
        return throwError(err);
      })
    );

    this.categories$ = this.categoryService.list({type: 'maintenance'}).pipe(
      catchError(err => {
        this.notification.error(null, err.error);
        return throwError(err);
      })
    );

    this.activeMenu = this.sessionService.getActiveMenu();

    this.initForm();
    this.initItemForm();
    this.getStatuses();
    this.getRooms();
    this.getRequest(this.id);
    this.subscribe();
  }

  ngAfterViewInit() {
    $('#nav-items-tab').on('shown.bs.tab', (e) => {
      $('#tab-items-add-btn').trigger('focus');

      this.ngZone.run(() => {
        if (!this.units.length) {
          this.getUnits();
        }
      })
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
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

  addItem() {
    const company_id = this.sessionService.getCompanyId();
    const fg = this.formBuilder.group({
      item_id: [null, Validators.required],
      item_type: 'GOODS',
      company_id: company_id,
      item: [null, Validators.required],
      storage_id: null,
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, Validators.required],
      description: null,
      units: null,
      meta: null,
      state: 'NEW',
      total: 0,
      sku: ''
    });

    this.submitted = false;
    this.RequestItems.push(fg);
  }

  bgColor = (status) => this.utilityService.statusStyle(status).background;

  deleteAttachment(docId: string) {
    this.maintenanceService.deleteAttachment(this.request.id, docId)
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

  dismissAll() {
    if (this.isModal) this.modalService.dismissAll(this.needReload);
  }

  @Confirmable({title: 'Dupliquer la requête'}, true)
  duplicate(response?: any) {
    if (response) {
      const formValue = this.requestForm.getRawValue();
      const maintenance = {
        category_id: formValue.category_id,
        category_name: formValue.category_name,
        comments: formValue.comments,
        description: formValue.description,
        due_at: moment().format(),
        requested_at: moment().format(),
        room_id: formValue.facility ? formValue.facility.id : null,
        status: 'DRAFT',
        title: formValue.title,
        type: formValue.type,
        request_type_id: formValue.request_type_id,
        Contacts: formValue.contact,
        Staffs: [
          {id: this.sessionService.getUser().id}
        ]
      };

      this.maintenanceService.create(maintenance)
        .toPromise()
        .then(res => {
          this.router.navigate(['maintenance/detail', res.id]);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(err, err.message));
    }
  }

  formatter = (x: string) => x;

  getPaymentDue(): number {
    return this.request ? this.invoiceService.getPaymentDue(this.request.RequestItems) : 0;
  }

  getTotalPerItem = (formGroup: FormGroup) => {
    const total = formGroup.controls['quantity'].value * formGroup.controls['price'].value;

    formGroup.patchValue({total: total});

    return total;
  };

  isNew = (item) => !item.controls['state'];
  isObject = (x: any) => x && typeof x === 'object';

  onAddContact(event) {
    if (event.id) {
      this.maintenanceService.updateBy(this.request.id, {contact_id: event.id}, 'contact')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.sharedService.newContact(null);
      this.sharedService.updateSidePanel(true);
      setTimeout(() => {
        const contactFA = this.requestForm.get("contact") as FormArray;
        if (contactFA) {
          const contacts = contactFA.value as any[];
          if (contacts && contacts.length) {
            contactFA.setValue(contacts.filter((item) => item.id));
          }
        }
      }, 0);
    }
  }

  onAddStaff(event) {
    if (event.id) {
      this.maintenanceService.updateBy(this.request.id, {staff_id: event.id}, 'staff')
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
      this.maintenanceService.removeBy(this.request.id, 'contact', event.value.id)
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.requestForm.get('contact').setValue(this.request.Contacts);
    }
  }

  @Confirmable({title: 'Retirer l\'utilisateur'}, true)
  onRemoveStaff(event, response?: any) {
    if (response) {
      this.maintenanceService.removeBy(this.request.id, 'staff', event.value.id)
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.requestForm.get('staff').setValue(this.request.Staffs);
    }
  }

  onSelectStatus(event) {
    this.maintenanceService.updateExtendedBy(this.request.id, {request_status_id: event
}, 'status')
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  onSelectType(event) {
    this.maintenanceService.updateExtendedBy(this.request.id, {request_type_id: event}, 'type')
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  openAppendModal() {
    const modal = this.modalService.open(AppendItemModalComponent, {
      size: 'md' as any
    });

    modal.result.then(item => {
      this.saveIndividualItem(item);
    }).catch(() => {
      console.log('Dismissed');
    });
  }

  preview() {
    if (this.requestForm.get('bill_id').value) {
      this.router.navigate(['/expense/bill/detail/', this.requestForm.get('bill_id').value])
        .then(() => {
        });
    }
  }

  print() {
    this.printService.request(this.request);
  }

  @Confirmable({title: 'Supprimer le produit'})
  removeItem(index: number, id: number) {
    this.maintenanceService.removeItem(this.request.id, id).toPromise().then(() => {
      this.resetForm();
      this.notification.success(null, 'UPDATE_SUCCESS');
    }).catch(err => this.notification.error(null, err.error));
  }

  resetForm() {
    this.doc_name = null;
    this.request = null;
    this.submitted = false;
    this.submitted_item = false;
    this.uploader = null;
    this.needReload = true;

    this.itemForm.reset();
    this.requestForm.reset({
      status: 'DRAFT'
    })
    this.initItemForm();
    this.getRequest(this.id);
  }

  saveItems() {
    this.submitted_item = true;

    if (this.itemForm.valid) {
      const params = this.itemForm.value;

      this.maintenanceService.updateItems(this.id, params)
        .toPromise()
        .then(() => {
          this.resetForm();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  sendSMS() {
    this.maintenanceService.sendSMS(this.id)
      .then(() => {
        this.resetForm();
        this.notification.success(null, 'SMS_SENT');
      })
      .catch(err => this.notification.error(err, err.message));
  }

  setTime(date, time: string): void { //  date (moment), time (HH:mm)
    const timesplit = time.split(':');
    date.set({hour: timesplit[0], minute: timesplit[1]});
  }

  subscribe() {
    this.subscription.add(
      this.sharedService.contact$.subscribe(contact => {
        if (contact) {
          this.requestForm.patchValue({
            contact_id: contact.id,
            contact_name: contact.name
          });
        }
      })
    );

    this.subscription.add(
      this.activatedRoute.paramMap.subscribe(param => {
        this.id = +param.get('id');
        this.getRequest(this.id);
      })
    );
  }

  updateRequest() {
    this.submitted = true;

    if (this.requestForm.valid) {
      const formValue = this.requestForm.getRawValue();
      const body: any = Object.assign({}, formValue, {
        category_id: formValue.category_id,
        id: this.id,
        room_id: formValue.facility ? formValue.facility.id : null,
        staff_id: formValue.staff ? formValue.staff.id : null,
        staff_name: formValue.staff ? formValue.staff.name : null
      });

      if (formValue.is_event) {
        const start = moment(formValue.event_start);
        const end = moment(formValue.event_end);

        if (formValue.event_start_time || formValue.event_start_time !== '') {
          this.setTime(start, formValue.event_start_time);
        }

        if (formValue.event_end_time || formValue.event_end_time !== '') {
          this.setTime(end, formValue.event_end_time);
        }

        body.event_start = start.format();
        body.event_end = end.format();
      }

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

  updateFacility(facility) {
    if (facility) {
      const body = {room_id: facility.id};

      this.maintenanceService.updateBy(this.request.id, body, 'facility')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, 'GENERIC_ERROR'));
    }
  }

  updateStaff(staff) {
    if (staff) {
      const body = {staff_id: staff.id};

      this.maintenanceService.updateBy(this.request.id, body, 'staff')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, 'GENERIC_ERROR'));
    }
  }

  updateStatus(status) {
    const params = {
      id: this.id,
      status: status
    };

    let observable: Observable<any>;

    observable = this.maintenanceService.updateStatus(params);

    observable
      .toPromise()
      .then(() => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');

        this.statusChange.next(params.status);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  attachmentUploaded(event: any) {
    this.resetForm();
  }

  get RequestItems(): FormArray {
    return this.itemForm.get('RequestItems') as FormArray;
  }

  private arrayToForm(array): void {
    array.forEach(item => {
      this.RequestItems.push(this.formBuilder.group({
        description: null,
        ...item,
        item
      }));
    });
  }

  private getRequest(id) {
    this.maintenanceService.get(id)
      .toPromise()
      .then(res => {
        this.request = new Request(res);
        const start = moment(res.event_start);
        const end = moment(res.event_end);

        this.requestForm.patchValue(Object.assign({}, res, {
          contact: res.Contacts,
          due_at: res.due_at ? new Date(res.due_at) : null,
          extended_status: res.RequestStatus,
          requested_at: res.requested_at ? new Date(res.requested_at) : null,
          facility: res.Room ? res.Room : null,
          staff: res.Staffs,
          event_start: res.is_event ? start.toDate() : null,
          event_start_time: res.is_event ? start.format('HH:mm') : null,
          event_end: res.is_event ? end.toDate() : null,
          event_end_time: res.is_event ? end.format('HH:mm') : null
        }));

        this.arrayToForm(res.RequestItems);
      })
      .catch(err => this.notification.error(err, err.error));
  }

  private getRooms() {
    this.roomService.getRooms()
      .then(res => this.facilities = res)
      .catch(err => this.notification.error(err, err.error));
  }

  private getStatuses() {
    this.maintenanceService.getListBy('status', {type: 'all'})
      .then(res => this.requestStatuses = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private getUnits() {
    this.inventoryService.getItemUnits()
      .then(res => this.units = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.staff$ = concat(
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

    this.submitted = false;
    this.requestForm = this.formBuilder.group({
      bill_id: null,
      category_id: [null, Validators.required],
      category_name: null,
      comments: null,
      contact: null,
      description: [null, Validators.required],
      due_at: null,
      extended_status: null,
      is_event: false,
      is_event_all_day: false,
      order_number: null,
      requested_at: null,
      reservation_id: null,
      request_type_id: null,
      event_start: null,
      event_start_time: null,
      event_end: null,
      event_end_time: null,
      facility: null,
      staff: [null, Validators.required],
      status: 'DRAFT',
      title: [null, Validators.required],
      type: [null, Validators.required]
    });
  }

  private initItemForm() {
    this.submitted_item = false;
    this.searchItem = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(800),
        distinctUntilChanged(),
        switchMap(term => this.itemService.select(term))
      );

    this.itemForm = this.formBuilder.group({
      RequestItems: this.formBuilder.array([])
    });
  }

  private saveIndividualItem(item: any) {
    item = {
      ...item,
      request_id: this.request.id
    };

    delete item.item;
    delete item.units;

    this.maintenanceService.addItem(this.request.id, item).toPromise().then(() => {
      this.resetForm();
      this.notification.success(null, 'SAVE_SUCCESS');
    }).catch(err => {
      this.notification.error(null, err.error);
    });
  }
}
