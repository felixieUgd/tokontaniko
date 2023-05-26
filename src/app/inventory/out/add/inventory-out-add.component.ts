import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable, concat, of, Subscription, from } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { CategoryService } from 'src/app/accounting/category/category.service';
import { AppService } from 'src/app/app.service';
import { RoomService } from 'src/app/_services/room.service';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import Category from 'src/app/models/category';
import Item, { InventoryStorage, ItemInventory, ItemUnit } from 'src/app/models/item';
import Room from 'src/app/models/room';
import { UserService } from 'src/app/settings/user/user.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { SessionService } from 'src/app/_services/session.service';
import { InventoryService } from '../../inventory.service';
import _orderBy from 'lodash.orderby';
import * as moment from 'moment';
import {MenService} from 'src/app/men/men.service';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {conditionalValidator} from 'src/app/_helpers/conditional-validator';
import Facility from 'src/app/models/facility';
import {BillService} from 'src/app/expense/bill/bill.service';
import {SettingsStructureStorageService} from 'src/app/settings/structure/storage/settings-structure-storage.service';
import {ContactService} from 'src/app/contact/contact.service';
import Contact from 'src/app/models/contact';
import {SettingsGeographyService} from 'src/app/settings/geography/settings-geography.service';

@Component({
  selector: 'app-inventory-out-add',
  templateUrl: './inventory-out-add.component.html',
  styleUrls: ['./inventory-out-add.component.css']
})
export class InventoryOutAddComponent implements OnInit, OnDestroy {

  contactInput$ = new Subject<string>();
  staffInput$ = new Subject<string>();

  categories: Observable<Category[]>;
  items: Array<Item> = [];
  requestForm: FormGroup;
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  filteredSourceRooms: Room[] = [];

  destinationInventories: ItemInventory[] = [];

  defaultTransferId: number;
  defaultBillTransferId: number;
  defaultOutId: number;
  defaultRoomId: number;
  defaultContact: Contact;

  requestId: number;

  inventoryStorages: InventoryStorage[] = [];

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

  facilityInput$ = new Subject<string>();
  sourceFacilityInput$ = new Subject<string>();
  searchFacility$ = this.getFacilityTypeahead(this.facilityInput$, (isLoading) => this.isFacilityLoading = isLoading);
  searchSourceFacility$ = this.getFacilityTypeahead(this.sourceFacilityInput$, (isLoading) => this.isSourceFacilityLoading = isLoading);

  isFacilityLoading: boolean;
  isSourceFacilityLoading: boolean;

  isSourceRoomLoading: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private menService: MenService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private sessionService: SessionService,
    private categoryService: CategoryService,
    private notification: NotificationService,
    private billService: BillService,
    private contactService: ContactService,
    private geographyService: SettingsGeographyService,
    private roomService: RoomService,
    private storageService: SettingsStructureStorageService,
    private inventoryService: InventoryService,
    private maintenanceService: MaintenanceService,
    private settingsCompanyService: SettingsCompanyService
  ) {}

  ngOnInit() {
    this.statuses = this.appService.statuses;

    this.subscription.add(
      this.route.params.subscribe(params => {
        if (params) {
          this.requestId = params['orderId'] ? +params['orderId'] : null;
        }
      })
    );

    this.loadDefaults();
    this.loadCategories();
    this.loadStorages();
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
      item: [null, Validators.required],
      company_id: company_id,
      description: null,
      item_id: 0,
      item_type: 'GOODS',
      state: 'NEW',
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: 0,
      storage_id: [null, Validators.required],
      unit_id: [null, Validators.required],
      units: null,
      total: 0,
      meta: null
    });

    this.RequestItems.push(fg);
  }

  onSelectItem = (event, group): void => {
    let clear = true;
    if (event && event.id) {
      if (event.available && event.available.quantity) {
        const category: Category = this.category.value;

        if (category) {
          clear = false;

          group.patchValue({
            item_id: event.id,
            item_type: event.type,
            name: event.name,
            price: event.sale_price || 0,
            units: event.Inventories.map((inventory: ItemInventory) => {
              return {
                id: inventory.unit_id,
                name: inventory.ItemUnit.name,
                storage_id: inventory.InventoryStorage ? inventory.InventoryStorage.id : null,
                remainingQuantity: inventory.quantity
              }
            }),
            total: 0
          });
        }
        else {
          this.notification.error(null, 'CATEGORY_NOT_FOUND');
        }
      }
      else {
        this.notification.error(null, 'ITEM_OUT_OF_STOCK');
      }
    }

    if (clear) {
      group.patchValue({
        item: null,
        item_id: null,
        item_type: null,
        units: null,
        unit_id: null,
        price: 0,
        name: null,
        storage_id: null
      });
    }
  }

  onSelectUnit = (event, group): void => {
    group.patchValue({
      unit_id: event? event.id: null,
      storage_id: event? event.storage_id: null
    });

    if (event) {
      if (this.category.value && this.category.value.id === this.defaultTransferId) {
        const find = this.destinationInventories.find(inventory => inventory.item_id === group.get('item_id').value && inventory.unit_id === event.id);
        if (!find) {
          this.notification.error(null, 'DESTINATION_INVENTORY_NOT_FOUND');
          group.patchValue({
            item: null,
            item_id: null,
            item_type: null,
            units: null,
            unit_id: null,
            price: 0,
            name: null,
            storage_id: null
          });
        }
      }
    }

  }

  removeItem(index) {
    this.RequestItems.removeAt(index);
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

  onSelectUser(event): void {
    event.preventDefault();

    if (event.item) {
      this.requestForm.patchValue({
        staff_id: event.item.id,
        staff_name: event.item.name
      });
    }
  }

  save() {
    this.submitted = true;

    if (this.requestForm.valid) {
      if (this.typeId) {
        const formValue = this.requestForm.getRawValue();

        let due_at = moment();
        if (formValue.facility && formValue.facility.Geography && formValue.facility.Geography.Parent && formValue.facility.Geography.Parent.meta && formValue.facility.Geography.Parent.meta.delivery_time) {
          due_at.add(formValue.facility.Geography.Parent.meta.delivery_time, 'days');
        }
        else {
          this.notification.warning(null, 'DELIVERY_TIME_NOT_SET');
        }

        const maintenance = {
          category_id: formValue.category.id,
          category_name: formValue.category.name,
          description: formValue.description,
          due_at: due_at.format(),
          request_type_id: this.typeId,
          requested_at: moment(formValue.requested_at).format(),
          room_id: formValue.room ? formValue.room.id : null,
          facility_id: formValue.facility ? formValue.facility.id: null,
          status: 'ON_HOLD',
          title: 'Sortie de stock',
          type: 'REQUEST',
          Staffs: formValue.staff,
          meta: {
            source_room_id: formValue.source_room? formValue.source_room.id: null,
            order_id: this.requestId? +this.requestId: null
          }
        };

        let storage = null;
        if (maintenance.category_id === this.defaultTransferId) {
          storage = this.inventoryStorages.find(storage => storage.room_id === maintenance.room_id);

          if (!storage) {
            return this.notification.error(null, 'STORAGE_NOT_FOUND');
          }
        }

        this.maintenanceService.create(maintenance)
          .toPromise()
          .then(created => {
            let items = formValue.RequestItems as any[];

            items = items.map(item => {
              const it = {
                ...item,
                request_id: created.id
              };

              delete it.item;
              delete it.units;

              return it;
            });

            this.notification.success(null, 'REQUEST_SAVED');

            return this.maintenanceService
                .addItemsByUnit(created.id, { RequestItems: items })
                .toPromise()
                .then(() => {
                  this.notification.success(null, 'PRODUCT_SAVED');

                  if (maintenance.category_id === this.defaultTransferId) {

                    return this.billService.createWithUnit(
                      {
                        category_id: this.defaultBillTransferId,
                        contact_id: this.defaultContact? this.defaultContact.id: null,
                        contact_name: this.defaultContact? this.defaultContact.name: null,
                        contact_phone: this.defaultContact? this.defaultContact.phone: null,
                        status: 'APPROVED',
                        currency_code: 'MGA',
                        currency_rate: 1,
                        billed_at: new Date().toISOString(),
                        due_at: due_at.toISOString(),
                        bill_number: this.appService.getBillCode(),
                        order_number: null,
                        notes: null,
                        request_id: created.id,
                        amount: 0,
                        bill_status_code: 'draft',
                        BillItems: items.map(item => {
                          return {
                            ...item,
                            storage_id: storage.id
                          }
                        })
                      }
                    ).then(bill => {
                      this.notification.success(null, 'TRANSFER_SAVED');
                    })
                  }
                })
                .finally(() => {
                  this.router.navigate(['/inventory/out/detail', created.id]);
                });
          })
          .catch(err => {
            this.notification.error(null, err.error);
            console.log(err);
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

  get RequestItems(): FormArray {
    return this.requestForm.get('RequestItems') as FormArray;
  }

  get category(): FormControl {
    return this.requestForm.get('category') as FormControl;
  }

  private initForm() {
    const user = this.sessionService.getUser();

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
      room: null,
      facility: [null, Validators.required],
      source_room: [null, conditionalValidator(() => this.category.value && this.category.value.id !== this.defaultTransferId, Validators.required, 'ROOM_NOT_SET')],
      source_facility: [null, conditionalValidator(() => this.category.value && this.category.value.id === this.defaultTransferId, Validators.required, 'FACILITY_NOT_SET')],
      staff: [
        null, Validators.required
      ],
      RequestItems: this.formBuilder.array([])
    });
  }

  private getFacilityTypeahead(input$: Subject<string>, loadingCallback?: (state: boolean) => void) {
    return concat(
      of([]),
      input$.pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.length <= 3)
            return [];

          if (loadingCallback) loadingCallback(true);

          return this.menService.select(term)
            .toPromise()
            .then(res => {
              return res && res.length > 0 ? res : [];
            })
            .catch(err => {
              this.notification.error(null, err.error);
            })
            .finally(() => {
              if (loadingCallback) loadingCallback(false);
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
    this.categories = this.categoryService.list({type: 'maintenance'}).pipe(
      map(categories => {
        return categories.filter(cat => cat.id === this.defaultOutId || cat.id === this.defaultTransferId);
      })
    );
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

    this.defaultBillTransferId = this.settingsCompanyService.getCompanyDefaultSettings('default_bill_inventory_transfer_category');
    if (!this.defaultBillTransferId) {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }

    const defaultContactId = this.settingsCompanyService.getCompanyDefaultSettings('default_provider');
    if (defaultContactId) {
      this.contactService.get(defaultContactId).toPromise().then(contact => {
        this.defaultContact = contact;
      }).catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'CONTACT_NOT_FOUND');
    }

    this.defaultRoomId = this.inventoryService.getDefaultRoomId();
    if (!this.defaultRoomId) {
      this.notification.error(null, 'DEFAULT_ROOM_NOT_FOUND');
    }

    this.typeId = this.inventoryService.getDefaultOutTypeId();

    if (!this.typeId) {
      this.notification.error(null, 'TYPE_NOT_FOUND');
    }
  }

  private loadRooms() {
    this.isSourceRoomLoading = true
    this.roomService.getRooms().then(rooms => {
      this.rooms = rooms;
    }).catch(err => this.notification.error(null, err.error))
    .finally(() => {
      this.isSourceRoomLoading = false;
    });
  }

  private loadStorages() {
    this.storageService.list().toPromise().then(
      storages => {
        this.inventoryStorages = storages;
      }
    ).catch(err => this.notification.error(null, err.error));
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
      this.category.valueChanges
        .pipe(
          switchMap((category: Category) => {
            if (category && category.id !== this.defaultTransferId) {
              return this.inventoryService.getInventoryByRoom(this.defaultRoomId, this.items);
            }
            else {
              return of([]);
            }
          })
        )
        .subscribe((inventories) => {
          if (this.items) {
            this.items = [...this.items];
          }
          else {
            this.notification.error(null, 'ITEMS_NOT_SET');
          }

          while (this.RequestItems.length > 0) {
            this.RequestItems.removeAt(0);
          }
        })
    );

    this.subscription.add(
      this.requestForm.get('source_room').valueChanges
        .pipe(
          tap(() => {
            this.isSourceRoomLoading = true;
          }),
          switchMap((room: Room) => {
            if (room) {
              return this.inventoryService.getInventoryByRoom(room.id, this.items);
            }
            else if (this.requestForm.get('source_facility').value) {
              return of([]);
            }
            else {
              return of(null);
            }
          })
        )
        .subscribe({
          next: (inventories) => {
            if (inventories) {
              if (this.items) {
                this.items = [...this.items];
              }
              else {
                this.notification.error(null, 'ITEMS_NOT_SET');
              }
            }
            this.isSourceRoomLoading = false;
          },
          error: err => {
            console.log(err);
            this.notification.error(null, err.error);
            this.isSourceRoomLoading = false;
          }
        })
    );

    this.subscription.add(
      this.requestForm.get('facility')
        .valueChanges
        .pipe(
          tap(() => {
            this.isFacilityLoading = true;
          }),
          switchMap((facility: Facility) => {
            if (this.category.value && this.category.value.id === this.defaultTransferId && facility) {
              return from(this.menService.get(facility.id)).pipe(switchMap(facility => {
                return this.geographyService.get(facility.Geography.Parent.id).pipe(
                  map(geography => {
                    facility.Geography.Parent = geography;
                    return facility;
                  })
                );
              }));
            }
            else {
              return of(facility);
            }
          })
        )
        .subscribe({
          next: (facility: Facility) => {
            if (facility) {
              this.requestForm.get('facility').setValue(facility, {emitEvent: false});
            }

            this.filteredRooms = facility ? this.rooms.filter(room => room.facility_id === facility.id) : [];
            this.requestForm.patchValue({
              room: null
            });
            this.isFacilityLoading = false;
          },
          error: err => {
            console.log(err);
            this.isFacilityLoading = false;
            this.notification.error(null, err.error);
          }
        })
    );

    this.subscription.add(
      this.requestForm.get('room').valueChanges.subscribe((room: Room) => {
        if (room) {
          if (this.category.value && this.category.value.id === this.defaultTransferId) {
            this.inventoryService.getInventoryByRoom(room.id).then(inventories => {
              this.destinationInventories = inventories;
            }).catch(err => this.notification.error(null, err.error));
          }
        }
        else {
          this.destinationInventories = [];
        }
      })
    );

    this.subscription.add(
      this.requestForm.get('source_facility').valueChanges.subscribe((facility: Facility) => {
        this.filteredSourceRooms = facility ? this.rooms.filter(room => room.facility_id === facility.id) : [];
        this.requestForm.patchValue({
          source_room: null
        });
      })
    );
  }

}
