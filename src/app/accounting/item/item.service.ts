import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';

import {Item, ItemVariation} from 'src/app/models/item';

import {TableState} from 'smart-table-core';
import {ServerResult} from '../../_services/smart-table.service';
import {AppService} from 'src/app/app.service';



@Injectable({
  providedIn: 'root'
})
export class ItemService {
  public static TS_KEY = 'TS_ITEM';
  public sidePanelItem = new Subject<boolean>();

  constructor(private http: HttpClient) {
  }

  create(item: Item): Observable<Item[]> {
    const url = [AppService.API, 'items'].join('/');
    return this.http.post<Item[]>(url, item);
  }

  deleteAttachment(id, docId): Promise<any> {
    const url = [AppService.API, 'items', id, 'attachment', docId].join('/');
    return this.http.delete<any>(url).toPromise();
  }

  get(id): Observable<Item> {
    const url = [AppService.API, 'items', id].join('/');
    return this.http.get<Item>(url);
  }

  getBy(type: 'index', params): Promise<Item[]> {
    const url = `${AppService.API}/items/${type}`;
    return this.http.get<Item[]>(url, {params}).toPromise();
  }

  getConfig(key?): TableState {
    const search = sessionStorage.getItem(key || ItemService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {direction: 'asc', pointer: 'name'},
      slice: {page: 1, size: 25}
    };
  }

  getVariations(body: any): Promise<ItemVariation[]> {
    const url = [AppService.API, 'items', 'variations'].join('/');
    return this.http.post<ItemVariation[]>(url, body).toPromise();
  }

  list(params?): Observable<Item[]> {
    const url = [AppService.API, 'items'].join('/');
    return this.http.get<Item[]>(url, {params});
  }

  listGrv(params?): Promise<Item[]> {
    const url = [AppService.API, 'items/grv'].join('/');
    return this.http.get<Item[]>(url, {params}).toPromise();
  }

  paginate(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || ItemService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'items', 'paginate'].join('/');
    return this.http.post<any>(url, tableState).toPromise();
  }

  select(term): Observable<Item[]> {
    const url = [AppService.API, 'items', term, 'select'].join('/');
    return this.http.get<Item[]>(url);
  }

  update(item: Item): Observable<Item[]> {
    const url = [AppService.API, 'items', item['id']].join('/');
    return this.http.put<Item[]>(url, item);
  }

  updateQuantity(item: Item): Promise<any> {
    const url = [AppService.API, 'items', item.id, 'quantity'].join('/');
    return this.http.put<any>(url, {quantity: +item.quantity}).toPromise();
  }

  updateSidePanel(value: any) {
    this.sidePanelItem.next(value);
  }

  variationV2(id: number, body: any): Observable<any[]> {
    const url = [AppService.API, 'items', id, 'variationV2'].join('/');
    return this.http.post<any[]>(url, body);
  }
}
