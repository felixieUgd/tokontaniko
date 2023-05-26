import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormArray} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Subscription, Observable, concat, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import Category from 'src/app/models/category';
import Request, { RequestStatus } from 'src/app/models/request';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SessionService} from 'src/app/_services/session.service';
import {SharedService} from 'src/app/_services/shared.service';
import {UtilityService} from 'src/app/_services/utility.service';
import { InventoryService } from '../../inventory.service';

import * as moment from 'moment';
import { ContactService } from 'src/app/contact/contact.service';
import { RoomService } from 'src/app/_services/room.service';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import Room from 'src/app/models/room';
import { UserService } from 'src/app/settings/user/user.service';
import User from 'src/app/models/user';
import Item, { InventoryStorage, ItemUnit } from 'src/app/models/item';

import _orderBy from 'lodash.orderby';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {SettingsStructureStorageService} from 'src/app/settings/structure/storage/settings-structure-storage.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AppendItemModalComponent} from 'src/app/ui-elements/modals/append-item-modal/append-item-modal.component';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';
import {BillService} from 'src/app/expense/bill/bill.service';

@Component({
  selector: 'app-inventory-out-detail',
  templateUrl: './inventory-out-detail.component.html',
  styleUrls: ['./inventory-out-detail.component.css']
})
export class InventoryOutDetailComponent implements OnInit, OnDestroy {

  contactInput$ = new Subject<string>();
  staffInput$ = new Subject<string>();

  categories: Category[];
  itemForm: FormGroup;
  requestForm: FormGroup;
  request: Request;
  requestStatuses: Array<RequestStatus>;
  rooms: Room[];
  subscription: Subscription;
  users: User[];

  units: ItemUnit[];
  inventoryStorages: InventoryStorage[];

  id;
  searchItem;
  submitted: boolean;
  submitted_item: boolean;

  editMode: boolean = false;

  items: Item[] = [];

  defaultOutId: number;
  defaultTransferId: number;

  constructor(
    public maintenanceService: MaintenanceService,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private roomService: RoomService,
    private notification: NotificationService,
    private printService: PrintService,
    private sessionService: SessionService,
    private sharedService: SharedService,
    private billService: BillService,
    private storageService: SettingsStructureStorageService,
    private inventoryService: InventoryService,
    private settingsCompanyService: SettingsCompanyService,
    private userService: UserService,
    private utilityService: UtilityService
  ) { }

  get isCompleted() {
    if (!this.request) return false;
    return this.request.status === 'COMPLETED';
  }

  ngOnInit() {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');

    this.initForm();
    this.initItemForm();

    this.loadDefaults();
    this.getCategories();
    this.loadStorages();
    this.getStatuses();
    this.getRooms();
    this.getItemUnits(this.id);
    this.subscribe();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
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
          return res.length > 0 ? res : [null];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  addItem() {
    const company_id = this.sessionService.getCompanyId();
    const fg = this.formBuilder.group({
      item: [null, Validators.required],
      description: null,
      item_id: [null, Validators.required],
      item_type: 'GOODS',
      company_id: company_id,
      storage_id: null,
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, Validators.required],
      meta: null,
      units: null,
      state: 'NEW',
      total: 0,
      unit_id: [null, Validators.required],
      sku: ''
    });

    this.submitted = false;
    this.editMode = true;
    this.RequestItems.push(fg);
  }

  bgColor = (status) => this.utilityService.statusStyle(status).background;

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

  formatter = (x: string) => x;

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
        const contactFA = this.requestForm.get('contact') as FormArray;
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

  onRemoveContact(event) {
    this.maintenanceService.removeBy(this.request.id, 'contact', event.value.id)
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  onRemoveStaff(event) {
    this.maintenanceService.removeBy(this.request.id, 'staff', event.value.id)
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  onSelectStatus(event: RequestStatus) {
    this.maintenanceService.updateExtendedBy(this.request.id, {request_status_id: event? event.id: null}, 'status')
      .then(res => {
        this.notification.success(null, 'UPDATE_SUCCESS');
        this.resetForm();
      })
      .catch(err => this.notification.error(null, err.error));
  }

  openAppendModal() {
    const modal = this.modalService.open(AppendItemModalComponent, {
      size: 'md' as any
    });

    modal.componentInstance.roomId = this.request.meta && this.request.meta.source_room_id ? this.request.meta.source_room_id : null;
    modal.result.then(item => {
      this.saveIndividualItem(item);
    }).catch(() => {
      console.log('Dismissed');
    });
  }

  print() {
    this.printService.inventoryOut(this.request);
  }

  @Confirmable({ title: 'Supprimer le produit' })
  removeItem(index: number, id: number) {
    if (this.isCompleted) {
      return this.notification.error(null, 'ACCESS_NOT_AUTHORIZED');
    }

    if (!id) {
      this.RequestItems.removeAt(index);
      this.editMode = false;
    }
    else {
      this.maintenanceService.removeItem(this.request.id, id).toPromise().then(() => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      }).catch(err => this.notification.error(null, err.error));
    }
  }

  resetForm() {
    this.request = null;
    this.submitted = false;
    this.submitted_item = false;

    this.itemForm.reset();
    this.requestForm.reset({
      status: 'DRAFT'
    })
    this.initItemForm();
    this.getRequest(this.id);
  }

  saveIndividualItem(item: any) {
    item = {
      ...item,
      request_id: this.request.id
    };

    delete item.item;
    delete item.units;

    this.maintenanceService.addItem(this.request.id, item).toPromise().then(() => {
      this.resetForm();
      this.notification.success(null, 'SAVE_SUCCESS');
      this.editMode = false;
    }).catch(err => {
      this.notification.error(null, err.error);
    });
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

  setTime(date, time: string): void { //  date (moment), time (HH:mm)
    const timesplit = time.split(':');
    date.set({hour: timesplit[0], minute: timesplit[1]});
  }

  subscribe() {
    this.subscription = this.sharedService.contact$.subscribe(contact => {
      if (contact) {
        this.requestForm.patchValue({
          contact_id: contact.id,
          contact_name: contact.name
        });
      }
    });
  }

  updateRequest() {
    this.submitted = true;

    if (this.requestForm.valid) {
      const formValue = this.requestForm.getRawValue();
      const body: any = Object.assign({}, formValue, {
        category_id: formValue.category_id,
        id: this.id,
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
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateRoom(room: Room) {
    if (room) {
      const body = {room_id: room.id};

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

    this.maintenanceService.updateStatus(params)
      .toPromise()
      .then(() => {
        this.notification.success(null, 'UPDATE_SUCCESS');
        if (this.request.RequestItems.length && status === 'REJECTED') {
          const promises = this.request.RequestItems.map((item) => {
            return this.maintenanceService.removeItem(this.request.id, item.id).toPromise();
          });

          if (this.request.category_id === this.defaultTransferId && this.request.Bills.length) {
            this.request.Bills.forEach(bill => {
              bill.BillItems.forEach((item, index) => {
                if (index < bill.BillItems.length - 1) {
                  promises.push(this.billService.removeItem(bill.id, item.id).toPromise());
                }
              });
              promises.push(this.billService.cancelWithUnit(bill).toPromise());
            });
          }

          return Promise.all(promises).then(() => {
            this.resetForm();
            this.notification.success(null, 'RESET_ITEM_SUCCESS');
          })
        }
        else {
          this.resetForm();
        }
      })
      .catch(err => this.notification.error(null, err.error));
  }

  get RequestItems(): FormArray {
    return this.itemForm.get('RequestItems') as FormArray;
  }

  private arrayToForm(array): void {
    array.forEach(item => {
      item.unit = this.units.find(unit => unit.id === item.unit_id);
      this.RequestItems.push(this.formBuilder.group({
        ...item,
        item,
        description: item.description || null
      }));
    });
  }

  private getCategories() {
    this.categoryService.list({type: 'maintenance'})
      .toPromise()
      .then(categories => this.categories = categories)
      .catch(err => this.notification.error(null, err.error));
  }

  private getRequest(id) {
    this.maintenanceService.get(id)
      .toPromise()
      .then(res => {
        if (res.request_type_id !== this.inventoryService.getDefaultOutTypeId()) {
          return this.notification.error(null, 'DOCUMENT_NOT_VALID');
        }

        this.request = new Request(res);
        const data = Object.assign({}, res, {
          room_id: res.Room ? res.Room.id : null,
          contact: res.Contacts,
          due_at: res.due_at ? new Date(res.due_at) : null,
          extended_status: res.RequestStatus,
          requested_at: res.requested_at ? new Date(res.requested_at) : null,
          staff: res.Staffs
        });

        Object.keys(data).forEach(name => {
          if (data[name] === null) {
            delete data[name];
          }
        });

        this.requestForm.patchValue(data);

        this.arrayToForm(res.RequestItems);
      })
      .catch(err => {
        console.log(err);
        this.notification.error(null, err.error)
      });
  }

  private getRooms() {
    this.roomService.getRooms()
      .then(res => this.rooms = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private getStatuses() {
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    let defaultId: number = null;

    if (!settings || !settings['default_inventory_category']) {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }
    else {
      defaultId = +settings['default_inventory_category'];
    }

    this.maintenanceService.listStatus(defaultId, true)
      .toPromise()
      .then(res => this.requestStatuses = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private getItemUnits(id: number) {
    this.inventoryService.getItemUnits()
      .then(res => {
        this.units = _orderBy(res, ['name'], ['asc']);
        this.getRequest(id);
      })
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
      event_start: null,
      event_start_time: null,
      event_end: null,
      event_end_time: null,
      meta: this.formBuilder.group({
        source_room_id: null
      }),
      room_id: null,
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
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(term => term.length <= 3 ? [] :
          this.inventoryService.select(term)
            .toPromise()
            .then(res => {
              return res.length > 0 ? res : [];
            })
            .catch(err => {
              this.notification.error(null, err.error);
              return [];
            })
        )
      );

    this.itemForm = this.formBuilder.group({
      RequestItems: this.formBuilder.array([])
    });
  }

  private loadDefaults() {
    this.defaultTransferId = this.settingsCompanyService.getCompanyDefaultSettings('default_inventory_transfer_category');
    if (!this.defaultTransferId) {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }

    this.defaultOutId = this.settingsCompanyService.getCompanyDefaultSettings('default_inventory_out_category');
    if (!this.defaultOutId) {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }
  }

  private loadStorages() {
    this.storageService.list().toPromise().then(
      storages => {
        this.inventoryStorages = storages;
      }
    ).catch(err => this.notification.error(null, err.error));
  }

}
