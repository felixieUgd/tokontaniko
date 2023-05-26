import {HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {environment} from 'src/environments/environment';
import Item, {ItemConversion, ItemInventory, ItemUnit} from 'src/app/models/item';
import { map } from 'rxjs/operators';
import { TableState } from 'smart-table-ng';
import { SettingsCompanyService } from '../settings/company/settings-company.service';

import _cloneDeep from 'lodash.clonedeep';
import {AppService} from '../app.service';
import {throwError} from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  public static KEY = 'FG_STRUCTURE_INVENTORY';

  orderReasons = ['Rupture de stock', 'Atteinte de stocks de sécurité', 'Besoins spécifiques', 'Autres'];

  constructor(private http: HttpClient) {}

  public getDefaultBillTransferId() {
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    if (settings && settings['default_bill_inventory_transfer_category']) {
      return +settings['default_bill_inventory_transfer_category'];
    }

    return 0;
  }

  public getDefaultOutTypeId() {
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    if (settings && settings['default_inventory_out_type']) {
      return +settings['default_inventory_out_type'];
    }

    return 0;
  }

  public getDefaultOrderTypeId() {
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    if (settings && settings['default_inventory_order_type']) {
      return +settings['default_inventory_order_type'];
    }

    return 0;
  }

  public getDefaultRoomId() {
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    if (settings && settings['default_inventory_room']) {
      return +settings['default_inventory_room'];
    }

    return 0;
  }

  getConfig = (KEY: string): TableState => {
    const search = sessionStorage.getItem(KEY);
    
    return search ? JSON.parse(search) : {
      search: {},
      filter: {
        request_type_id: [
          {
            value: this.getDefaultOutTypeId(),
            operator: 'equals',
            type: 'number'
          }
        ]
      },
      sort: {pointer: 'requested_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  }

  getOrderConfig = (KEY: string): TableState => {
    const search = sessionStorage.getItem(KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {
        request_type_id: [
          {
            value: this.getDefaultOrderTypeId(),
            operator: 'equals',
            type: 'number'
          }
        ]
      },
      sort: {pointer: 'requested_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  }

  getShippingConfig = (KEY: string): TableState => {
    const search = sessionStorage.getItem(KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {
        /* contact_id: [
          {
            value: 1818,
            operator: 'equals',
            type: 'number'
          }
        ] */
        /* category_id: [
          {
            value: this.getDefaultBillTransferId(),
            operator: 'equals',
            type: 'number'
          }
        ] */
      },
      sort: {pointer: 'status', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  }

  convertUnit(body): Promise<any> {
    const url = [AppService.API, 'inventory/units/conversion'].join('/');
    return this.http.post<any>(url, body).toPromise();
  }

  createUnit(body: any): Promise<ItemUnit> {
    const url = [AppService.API, 'inventory/units'].join('/');
    return this.http.post<ItemUnit>(url, body).toPromise();
  }

  getInventory(): Promise<ItemInventory[]> {
    const url = [AppService.API, 'inventory'].join('/');
    return this.http.get<ItemInventory[]>(url).toPromise();
  }

  getInventoryList(): Promise<any[]> {
    const url = [AppService.API, 'inventory', 'list'].join('/');
    return this.http.get<any[]>(url).toPromise();
  }

  getInventoryByRoom(room_id: number, items?: Item[]) {
    const url = [AppService.API, 'inventory', 'room', room_id].join('/');
    return this.http.get<ItemInventory[]>(url)
      .pipe(
        map(inventories => {
          if (items) {
            this.mapInventoriesToItems(inventories, items);
          }
          return inventories;
        })
      )
      .toPromise();
  }

  getInventoryByDefaultRoom(items?: Item[]) {
    const roomId = this.getDefaultRoomId();
    if (roomId) {
      return this.getInventoryByRoom(roomId, items);
    }
    else {
      return Promise.reject({error: 'DEFAULT_ROOM_NOT_FOUND'});
    }
  }

  getInventoryUnitConversion(): Promise<ItemConversion[]> {
    const url = [AppService.API, 'inventory/units/conversion'].join('/');
    return this.http.get<ItemConversion[]>(url).toPromise();
  }

  getItemUnits(): Promise<ItemUnit[]> {
    const url = [AppService.API, 'inventory/units'].join('/');
    return this.http.get<ItemUnit[]>(url).toPromise();
  }

  getItemUnit(id: number): Promise<ItemUnit> {
    const url = [AppService.API, 'inventory/units', id].join('/');
    return this.http.get<ItemUnit>(url).toPromise();
  }

  getVariations(data: any) {
    const url = [AppService.API, 'items/variations/unit'].join('/');
    return this.http.post<any[]>(url, data);
  }

  getVariationsByItem(id: number, start: string) {
    const url = [AppService.API, 'items', id, 'variation/unit'].join('/');
    return this.http.post<any[]>(url, { start });
  }

  select(term: string) {
    const url = [AppService.API, 'items', term, 'select/unit'].join('/');
    return this.http.get<any[]>(url).pipe(
      map(res => {
        return res.filter(item => {
          const inventories = item.Inventories;
          if (!inventories || !inventories.length) return false;

          let available: any;

          for (let inventory of inventories) {
            if (inventory.quantity > 0) {
              available = inventory;
              break;
            }
          }

          if (available) {
            item.available = available;
          }

          return true;
        });
      })
    );
  }

  selectByRoom(term: string, room_id: number, items?: Item[]) {
    const url = [AppService.API, 'inventory', 'room', room_id, 'select', term].join('/');
    return this.http.get<ItemInventory[]>(url)
      .pipe(
        map(inventories => {
          if (items) {
            this.mapInventoriesToItems(inventories, items);
          }
          return inventories;
        })
      );
  }

  selectByDefaultRoom(term: string, items?: Item[]) {
    const roomId = this.getDefaultRoomId();
    if (roomId) {
      return this.selectByRoom(term, roomId, items);
    }
    else {
      return throwError({error: 'DEFAULT_ROOM_NOT_FOUND'});
    }
  }

  setUnit(body: any): Promise<any> {
    const url = [AppService.API, 'inventory'].join('/');
    return this.http.post<any>(url, body).toPromise();
  }

  updateInventoryStorage(inventory: Partial<ItemInventory>, storage_id: number) {
    const url = [AppService.API, 'inventory', 'storage'].join('/');
    return this.http.put(url, { ...inventory, storage_id });
  }

  private mapInventoriesToItems(inventories: ItemInventory[], items: Item[]) {
    items.length = 0;
    if (inventories) {
      for (let inventory of inventories) {
        const value = {
          unit_id: inventory.unit_id,
          InventoryStorage: inventory.InventoryStorage,
          ItemUnit: inventory.ItemUnit,
          quantity: inventory.quantity,
        };

        const find = items.find(
          (item) => item.id === inventory.Item.id
        );

        if (find) {
          find.Inventories.push(value);

          for (let inv of find.Inventories) {
            if (inv.quantity > 0) {
              find.available = inv;
              break;
            }
          }
        } else {
          let inv = {
            ...inventory.Item,
            available: value,
            Inventories: [value],
          };

          items.push(inv);
        }
      }
    }
  }
}
