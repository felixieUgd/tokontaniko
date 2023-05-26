import { Component, OnDestroy, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormArray, FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {Subject, Observable, Subscription, concat, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {AppService} from 'src/app/app.service';
import {ContactService} from 'src/app/contact/contact.service';
import {RoomService} from 'src/app/_services/room.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {MenService} from 'src/app/men/men.service';
import Category from 'src/app/models/category';
import Facility from 'src/app/models/facility';
import Item, {ItemUnit} from 'src/app/models/item';
import Room from 'src/app/models/room';
import * as moment from 'moment';
import {UserService} from 'src/app/settings/user/user.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {InventoryService} from '../../inventory.service';
import {SharedService} from 'src/app/_services/shared.service';

import _orderBy from 'lodash.orderby';

@Component({
  selector: 'app-inventory-order-add',
  templateUrl: './inventory-order-add.component.html',
  styleUrls: ['./inventory-order-add.component.css']
})
export class InventoryOrderAddComponent implements OnInit, OnDestroy {

  contactInput$ = new Subject<string>();
  staffInput$ = new Subject<string>();

  categories: Observable<Category[]>;
  items: Array<Item> = [];
  requestForm: FormGroup;
  rooms: Room[] = [];
  filteredRooms: Room[] = [];

  units: ItemUnit[];

  statuses: any[];
  submitted: boolean;

  subscription = new Subscription();

  typeId: number;

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

  contact$ = concat(
    of([]),
    this.contactInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.contactService.select(term)
        .toPromise()
        .then(res => {
          return res.length > 0 ? res : [{id: null, name: 'Ajouter'}];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  facilityInput$ = new Subject<string>();
  searchFacility$ = this.getFacilityTypeahead(this.facilityInput$);

  constructor(
    public inventoryService: InventoryService,
    private router: Router,
    private appService: AppService,
    private menService: MenService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private sessionService: SessionService,
    private categoryService: CategoryService,
    private notification: NotificationService,
    private sharedService: SharedService,
    private contactService: ContactService,
    private roomService: RoomService,
    private maintenanceService: MaintenanceService
  ) { }

  ngOnInit() {
    this.statuses = this.appService.statuses;

    this.loadDefaults();
    this.loadCategories();
    this.loadRooms();
    this.initForm();
    this.valueChanges();
    this.getItemUnits();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addItem() {
    const company_id = this.sessionService.getCompanyId();

    const fg = this.formBuilder.group({
      company_id: company_id,
      description: null,
      item_id: null,
      item_type: 'GOODS',
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: 0,
      unit_id: [null, Validators.required],
      units: null,
      total: 0,
      meta: null
    });

    this.OrderItems.push(fg);
  }

  onSelectItem = (event, group): void => {
    event.preventDefault();

    if (event.item) {
      group.patchValue({
        item_id: event.item.id,
        item_type: event.item.type,
        name: event.item.name,
        sku: event.item.sku,
        price: event.item.sale_price,
        units: event.item.Inventories.map((inventory: any) => {
          return {
            id: inventory.unit_id,
            name: inventory.ItemUnit.name,
            remainingQuantity: inventory.quantity
          }
        }),
        total: 0
      });
    }
    else {
      this.sharedService.updateSidePanelItem(true);
    }
  }

  removeItem(index) {
    this.OrderItems.removeAt(index);
  }

  searchItem = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) return [];
        else return this.selectItem(term);
      })
    );

  onSelectContact(event) {
    if (!event.id) {
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

  onSelectUser(event): void {
    event.preventDefault();

    if (event.item) {
      this.requestForm.patchValue({
        staff_id: event.item.id,
        staff_name: event.item.name
      });
    }
  }

  onSelectReason(event):  void {
    const value = event === 'Autres'? null: event;
    this.requestForm.get('description').patchValue(value);
  }

  save() {
    this.submitted = true;

    if (this.requestForm.valid) {
      if (this.typeId) {
        const formValue = this.requestForm.getRawValue();
        const maintenance = {
          category_id: formValue.category.id,
          category_name: formValue.category.name,
          description: formValue.description,
          due_at: moment(formValue.due_at).format(),
          request_type_id: this.typeId,
          requested_at: moment(formValue.requested_at).format(),
          room_id: formValue.room ? formValue.room.id : null,
          facility_id: formValue.facility ? formValue.facility.id : null,
          status: 'ON_HOLD',
          title: 'Bon de commande',
          type: 'REQUEST',
          Contacts: formValue.contact,
          Staffs: formValue.staff,
          meta: {
            OrderItems: formValue.OrderItems.map(item => {
              const it = {
                ...item
              };

              delete it.units;

              return it;
            })
          }
        };

        this.maintenanceService.create(maintenance)
          .toPromise()
          .then(created => {
            this.notification.success(null, 'SAVE_SUCCESS');

            this.router.navigate(['/inventory/order/detail', created.id]);
          })
          .catch(err => {
            this.notification.error(null, err.error);
          });
      }
      else {
        this.notification.error(null, 'TYPE_NOT_FOUND');
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  get OrderItems(): FormArray {
    return this.requestForm.get('OrderItems') as FormArray;
  }

  get category(): FormControl {
    return this.requestForm.get('category') as FormControl;
  }

  private initForm() {

    this.submitted = false;
    this.requestForm = this.formBuilder.group({
      bill_id: null,
      category: [null, Validators.required],
      contact: null,
      description: [null, Validators.required],
      due_at: new Date(),
      order_number: null,
      requested_at: new Date(),
      reservation_id: null,
      reason: [null, Validators.required],
      room: null,
      facility: [null, Validators.required],
      staff: null,
      OrderItems: this.formBuilder.array([], Validators.required)
    });
  }

  private getFacilityTypeahead(input$: Subject<string>) {
    return concat(
      of([]),
      input$.pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.length <= 3)
            return [];
          return this.menService.select(term)
            .toPromise()
            .then(res => {
              return res && res.length > 0 ? res : [];
            })
            .catch(err => {
              this.notification.error(null, err.error);
            })
        })
      )
    );
  }

  private getItemUnits() {
    this.inventoryService.getItemUnits()
      .then(res => {
        this.units = _orderBy(res, ['name'], ['asc']);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private loadCategories() {
    this.categories = this.categoryService.list({type: 'maintenance'});
  }

  private loadDefaults() {
    this.typeId = this.inventoryService.getDefaultOrderTypeId();
    if (!this.typeId) {
      this.notification.error(null, 'TYPE_NOT_FOUND');
    }
  }

  private loadRooms() {
    this.roomService.getRooms().then(rooms => {
      this.rooms = rooms;
    }).catch(err => this.notification.error(null, err.error));
  }

  private selectItem(term) {
    return this.inventoryService.select(term)
      .toPromise()
      .then(res => {
        return res;
      })
      .catch(err => {
        this.notification.error(null, err.error);
        return [];
      });
  }

  private valueChanges() {
    this.subscription.add(
      this.requestForm.get('facility').valueChanges.subscribe((facility: Facility) => {
        this.filteredRooms = facility ? this.rooms.filter(room => room.facility_id === facility.id) : [];
        this.requestForm.patchValue({
          room: null
        });
      })
    );
  }


}
