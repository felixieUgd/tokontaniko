import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {concat, Observable, Subject, Subscription, of as rxjsOf, of} from 'rxjs';

import _forEach from 'lodash.foreach';
import _groupBy from 'lodash.groupby';
import _orderBy from 'lodash.orderby';
import _sumBy from 'lodash.sumby';
import server from 'smart-table-server';
import {SmartTable, of as ofST} from 'smart-table-ng';
import {FilterOperator} from 'smart-table-core';
import Item, {InventoryStorage, ItemConversion, ItemInventory, ItemUnit, ItemVariation} from 'src/app/models/item';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {AppService} from 'src/app/app.service';
import {ExportService} from 'src/app/_services/export.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {SharedService} from 'src/app/_services/shared.service';
import {ItemService} from '../accounting/item/item.service';
import {InventoryService} from './inventory.service';
import { SessionService } from '../_services/session.service';
import Room from '../models/room';
import {SettingsStructureStorageService} from '../settings/structure/storage/settings-structure-storage.service';
import {TranslateService} from '@ngx-translate/core';

declare var $: any; // JQuery

type ItemPair<T> = {
  Item: Item,
  values: T[]
};

type ItemMap<T> = Array<ItemPair<T>>;
@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['../../assets/scss/plugins/_datepicker.scss'],
  providers: [
    {
      provide: SmartTable,
      useFactory: (itemService: ItemService) =>
        ofST(
          [],
          itemService.getConfig(),
          server({
            query: (tableState) => itemService.paginate(tableState),
          })
        ),
      deps: [ItemService],
    },
  ],
})
export class InventoryComponent implements OnInit, OnDestroy {
  itemInput$ = new Subject<string>();

  inventoryForm: FormGroup;
  conversionForm: FormGroup;

  searchInventory: string;
  searchConversion: string;
  searchInventoryConfig: string;

  subscriptions: Subscription[] = [];
  units: ItemUnit[];
  variations: ItemVariation[];
  conversions: Array<ItemConversion>;
  conversionByItem: ItemMap<ItemConversion> = [];
  inventoryByItem: ItemMap<ItemInventory>;
  inventory: any[];
  inventoryDisplay: any[];

  activeRoom: Room;
  destinationRoom: Room;
  selectedInventoryGroup: ItemPair<ItemInventory>;
  selectedType?: string = '';

  submitted: boolean;
  submitted_conversion: boolean;
  submitted_inventory: boolean;
  submitted_inventory_copy: boolean;
  submitted_inventory_room_config: boolean;
  types: any[];

  selectedFilter;
  activeMenu: any;

  storages: InventoryStorage[] = [];

  facilityInput$ = new Subject<string>();
  searchFacility$: Observable<any>;
  isFacilityLoading: boolean = false;

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private inventoryService: InventoryService,
    private itemService: ItemService,
    private notification: NotificationService,
    private translateService: TranslateService,
    private printService: PrintService,
    private sharedService: SharedService,
    private sessionService: SessionService,
    private storageService: SettingsStructureStorageService,
    public smartTableService: SmartTableService
  ) {}

  ngOnInit() {
    const session: any = sessionStorage.getItem(ItemService.TS_KEY);
    const parsed = JSON.parse(session);
    this.selectedFilter =
      parsed && parsed.filter.hasOwnProperty('type')
        ? parsed.filter.type[0].value
        : 'GOODS';

    this.selectedType = this.selectedFilter;

    this.types = ['', 'ASSET', 'GOODS', 'SERVICES'];

    this.activeMenu = this.sessionService.getActiveMenu();

    this.initForm();
    this.filterByType(this.selectedFilter);
    this.getConversion();
    this.getInventory();
    this.getItemUnits();
    this.fetchStorages();

    this.subscriptions.push(
      this.sharedService.sidePanelItem.subscribe(
        (value: any) => {
          if (!value) this.reset();
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  addInventory() {
    if (this.inventoryForm.valid) {
      const formValue = this.inventoryForm.getRawValue();
      const units: ItemUnit[] = formValue.units;

      let storage = null;
      if (this.activeRoom) {
        storage = this.storages.find(storage => storage.room_id === this.activeRoom.id);
      }

      if (!storage) {
        return this.notification.error(null, 'STORAGE_NOT_FOUND');
      }

      const promises: Promise<any>[] = [];

      for (let unit of units) {
        const inventory = {
          item_id: formValue.item_id,
          unit_id: unit.id,
          storage_id: storage.id
        };

        promises.push(this.inventoryService
          .setUnit(inventory));
      }

      Promise.all(promises).then((res) => {
        this.getInventory();
        this.getInventoryConfigByRoom();
        this.closeInventoryModal();
        this.notification.success(null, 'SAVE_SUCCESS');
      })
      .catch((err) => this.notification.error(null, err.error));
      
    } else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  closeCopyModal() {
    $('#copyModal').modal('hide');
    this.submitted_inventory_copy = false;
  }

  closeInventoryModal() {
    $('#inventoryModal').modal('hide');
    this.submitted_inventory = false;
    this.inventoryForm.reset();
  }

  closeModal() {
    $('#conversionModal').modal('hide');
    this.submitted_conversion = false;
    this.conversionForm.reset();
  }

  convertUnit() {
    this.submitted_conversion = true;

    if (this.conversionForm.valid) {
      const body = this.conversionForm.value;

      this.inventoryService
        .convertUnit(body)
        .then((res) => {
          this.conversions = [];
          this.getConversion();
          this.getInventory();
          this.closeModal();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch((err) => this.notification.error(null, err.error));
    } else this.notification.error(null, 'FORM_NOT_VALID');
  }

  copyInventoryToDestinationRoom() {
    if (this.selectedInventoryGroup) {
      this.submitted_inventory_copy = true;
      if (this.destinationRoom) {
        let storage = this.storages.find(storage => storage.room_id === this.destinationRoom.id);

        if (!storage) {
          return this.notification.error(null, 'STORAGE_NOT_FOUND');
        }

        const promises: Promise<any>[] = [];

        for (let inv of this.selectedInventoryGroup.values) {
          const inventory = {
            item_id: this.selectedInventoryGroup.Item.id,
            unit_id: inv.ItemUnit.id,
            storage_id: storage.id
          };
  
          promises.push(this.inventoryService
            .setUnit(inventory));
        } 

        Promise.all(promises).then((res) => {
          this.closeCopyModal();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
          .catch((err) => this.notification.error(null, err.error));
      }
      else {
        this.notification.error(null, 'FORM_NOT_VALID');
      }
    }
    else {
      this.notification.error(null, 'INVENTORY_NOT_FOUND');
    }
    
    
  }

  exportInventoryExcel() {
    const data: any = [];
    this.filterInventory(this.inventory).forEach((inv) => {
      data.push({
        'ID Stock': inv.item_id,
        'Désignation': inv.item_name,
        'SKU': inv.item_sku,
        'Type': (this.translateService.instant('item_type.' + inv.item_type) || '').toUpperCase(),
        'Unité': inv.unit_name,
        'Reste': inv.quantity,
      });
    });
    this.exportService.exportToExcel(data, 'inventaire');
  }

  exportInventoryPdf() {
    this.printService.closingByUnit(this.filterInventory(this.inventory));
  }

  filterConversion(array: any[]) {
    if (!array) return [];
    if (!this.searchConversion) return array;

    return array.filter((value) => {
      return (
        value.Item.name
          .toLowerCase()
          .indexOf(this.searchConversion.toLowerCase()) !== -1
      );
    });
  }

  filterInventory(array: any[]) {
    if (!array) return [];
    if (!this.searchInventory && !this.selectedType) return array;

    return array.filter((value) => {
      return (
        (!this.searchInventory || value.item_name
          .toLowerCase()
          .indexOf(this.searchInventory.toLowerCase()) !== -1)
        && (!this.selectedType || value.item_type === this.selectedType)
      );
    });
  }

  filterConfig(array: ItemMap<ItemInventory>) {
    if (!array) return [];
    if (!this.searchInventoryConfig) return array;

    return array.filter((value) => {
      return (
        value.Item.name
          .toLowerCase()
          .indexOf(this.searchInventoryConfig.toLowerCase()) !== -1
      );
    });
  }

  filterByType(type) {
    this._table.filter({
      type: [
        {
          value: type,
          operator: FilterOperator.EQUALS,
          type: 'string',
        },
      ],
    });
  }

  formatName(str: string): string {
    if (!str) {
      return null;
    }

    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
  }

  getInventory() {
    this.inventory = null;
    this.inventoryDisplay = null;
    this.inventoryService
      .getInventoryList()
      .then((res) => {
        this.inventory = _orderBy(res, 'item_name');

        this.inventoryDisplay = this.inventory;
      })
      .catch((err) => this.notification.error(null, err.error));
  }

  getInventoryConfig() {
    this.inventoryByItem = null;
    this.inventoryService
      .getInventory()
      .then((res) => {
        res.sort((a, b) => {
          return a.Item.id - b.Item.id;
        });

        this.inventoryByItem = [];

        for (let inventory of res) {
          const find = this.inventoryByItem.find(
            (inv) => inv.Item.id === inventory.Item.id
          );
          const value = {
            ItemUnit: inventory.ItemUnit,
            quantity: inventory.quantity,
          };          

          if (find) {
            find.values.push(value);
          } else {
            this.inventoryByItem.push({
              Item: inventory.Item,
              values: [value],
            });
          }
        }
      })
      .catch((err) => this.notification.error(null, err.error));
  }

  getInventoryConfigByRoom() {
    this.submitted_inventory_room_config = true;

    if (this.activeRoom) {
      this.inventoryByItem = null;
      this.inventoryService
        .getInventoryByRoom(this.activeRoom.id)
        .then((res) => {
          res.sort((a, b) => {
            return a.Item.id - b.Item.id;
          });

          this.inventoryByItem = [];

          for (let inventory of res) {
            const find = this.inventoryByItem.find(
              (inv) => inv.Item.id === inventory.Item.id
            );
            const value = {
              ItemUnit: inventory.ItemUnit,
              quantity: inventory.quantity,
            };

            if (find) {
              find.values.push(value);
            } else {
              this.inventoryByItem.push({
                Item: inventory.Item,
                values: [value],
              });
            }
          }
        })
        .catch((err) => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  setSelectedProduct(item: Item) {
    this.conversionForm.patchValue({
      search: item.name,
      item_id: item.id,
    });

    this.inventoryForm.patchValue({
      search: item.name,
      item_id: item.id,
    });
  }

  onSelectItem(fg: FormGroup, event: any) {
    event.preventDefault();

    if (event) {
      fg.patchValue({
        item_id: event.item.id,
        search: event.item.name,
      });
    } else this.sharedService.sidePanelItem.next(true);
  }

  open() {
    this.sharedService.updateSidePanelItem(true);
  }

  reset() {
    this._table.exec();
  }

  searchItem = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term.length < 3) return [];
        else return this.selectItem(term);
      })
    );

  selectItem$ = concat(
    rxjsOf([]),
    this.itemInput$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((term) =>
        !term || term.length < 3 ? [] : this.itemService.select(term)
      )
    )
  );

  private fetchStorages() {
    this.storageService.list().toPromise()
      .then(storages => {
        this.storages = storages;
      }).catch(err => this.notification.error(null, err.error));
  }

  private getConversion() {
    this.inventoryService
      .getInventoryUnitConversion()
      .then((res) => {
        this.conversions = res;
        this.conversionByItem = [];

        res.forEach((conversion) => {
          const find = this.conversionByItem.find(
            (conv) => conv.Item && conv.Item.id === conversion.Item.id
          );
          const value = conversion;

          if (find) {
            find.values.push(value);
          } else {
            this.conversionByItem.push({
              Item: conversion.Item,
              values: [value],
            });
          }
        });

        this.conversionByItem = _orderBy(this.conversionByItem, ['Item.name']);
      })
      .catch((err) => {
        console.log(err);
        this.notification.error(null, err.error);
      });
  }

  private getItemUnits() {
    this.inventoryService
      .getItemUnits()
      .then((res) => {
        this.units = _orderBy(res, ['name'], ['asc']);
      })
      .catch((err) => this.notification.error(null, err.error));
  }

  private initForm() {
    this.submitted = false;

    this.conversionForm = this.formBuilder.group({
      search: [null, Validators.required],
      item_id: [null, Validators.required],
      from_unit_id: [null, Validators.required],
      to_unit_id: [null, Validators.required],
      conversion_factor: [null, Validators.required],
    });

    this.inventoryForm = this.formBuilder.group({
      search: null,
      item_id: [null, Validators.required],
      units: [null, Validators.required],
    });
  }

  private selectItem(term) {
    return this.itemService
      .select(term)
      .toPromise()
      .then((res) => {
        return res.length > 0 ? res : [null];
      })
      .catch((err) => this.notification.error(null, err.error));
  }
}
