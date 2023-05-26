import {HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {AppService} from 'src/app/app.service';
import {InventoryStorage} from 'src/app/models/item';
import {SettingsCompanyService} from '../../company/settings-company.service';

export const STORAGE_TYPES = ['UNK'];

@Injectable({
  providedIn: 'root'
})
export class SettingsStructureStorageService {

  constructor(private httpClient: HttpClient) { }

  create(storage: Partial<InventoryStorage>) {
    const url = [AppService.API, 'inventory', 'storage'].join('/');
    return this.httpClient.post(url, storage);
  }

  getDefaultStorageId() {
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    if (settings && settings['default_inventory_storage']) {
      return +settings['default_inventory_storage'];
    }

    return 0;
  }

  list() {
    const url = [AppService.API, 'inventory', 'storage'].join('/');
    return this.httpClient.get<InventoryStorage[]>(url);
  }

  update(id: number, storage: Partial<InventoryStorage>) {
    const url = [AppService.API, 'inventory', 'storage', id].join('/');
    return this.httpClient.put(url, storage);
  }
}
