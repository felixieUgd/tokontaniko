import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';
import {FilterOperator} from 'smart-table-core';
import {SmartTable} from 'smart-table-ng';
import Request, {RequestHistory, RequestStatus, RequestType} from 'src/app/models/request';

import {environment} from 'src/environments/environment';
import {TableState} from 'smart-table-core';
import {ServerResult} from 'src/app/_services/smart-table.service';
import {SessionService} from '../_services/session.service';
import {TranslateService} from '@ngx-translate/core';
import { SettingsCompanyService } from '../settings/company/settings-company.service';
import { catchError, map } from 'rxjs/operators';
import {AppService} from '../app.service';



const REQUEST_STATUSES = [
  'APPROVED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'REJECTED'
];

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {

  public static TS_KEY = 'TS_MAINTENANCE';
  private _urlParams: HttpParams = null;
  private _statuses: Array<string>;

  constructor(
    private httpClient: HttpClient,
    private sessionService: SessionService,
    private translateService: TranslateService
  ) {
    this._statuses = REQUEST_STATUSES;
  }

  get statuses() {
    return this._statuses;
  }

  set urlParams(params: any) {
    this._urlParams = params ? new HttpParams({fromObject: params}) : new HttpParams();
  }

  addHistory(params): Observable<any> {
    const url = [AppService.API, 'requests', params['id'], 'note'].join('/');
    return this.httpClient.put<any>(url, params);
  }

  create(request): Observable<Request> {
    const url = [AppService.API, 'requests'].join('/');
    return this.httpClient.post<Request>(url, request);
  }

  createExtendedStatus(status: Partial<RequestStatus>) {
    const url = [AppService.API, 'requests', 'status'].join('/');
    return this.httpClient.post<RequestStatus>(url, status);
  }

  createExtendedType(extendedType: RequestType) {
    const url = [AppService.API, 'requests', 'type'].join('/');
    return this.httpClient.post<RequestType>(url, extendedType);
  }

  deleteAttachment(id, docId): Promise<any> {
    const url = [AppService.API, 'requests', id, 'attachment', docId].join('/');
    return this.httpClient.delete<any>(url).toPromise();
  }

  drafts(params?: any): Promise<Array<any>> {
    const url = [AppService.API, 'requests', 'draft'].join('/');
    return this.httpClient.get<Array<any>>(url, {params: params}).toPromise();
  }

  get(id): Observable<Request> {
    const url = [AppService.API, 'requests', id].join('/');
    return this.httpClient.get<Request>(url);
  }

  getConfig = (KEY?): TableState => {
    const search = sessionStorage.getItem(KEY || MaintenanceService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  }

  getDashboardConfig = (KEY: string): TableState => {
    const search = sessionStorage.getItem(KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {
        created_at: [
          {
            value: moment().startOf('week').startOf('day').format(),
            operator: FilterOperator.GREATER_THAN_OR_EQUAL,
            type: 'string'
          },
          {
            value: moment().endOf('week').endOf('day').format(),
            operator: FilterOperator.LOWER_THAN_OR_EQUAL,
            type: 'string'
          }
        ]
      },
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  }

  getTimelineConfig = (KEY: string, settingKey?: string): TableState => {
    const search = sessionStorage.getItem(KEY);
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));

    return search ? JSON.parse(search) : {
      search: {},
      filter: {
        request_type_id: [
          {
            value: +settings[settingKey || 'default_timeline_event_type'],
            operator: 'equals',
            type: 'number'
          }
        ]
      },
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  }

  getEvents(body) {
    const url = [AppService.API, 'requests', 'schedule'].join('/');
    return this.httpClient.post<any[]>(url, body);
  }

  /*  {type: 'all'} */
  getListBy(type: string, params?: any): Promise<any[]> {
    const url = [AppService.API, 'requests', type].join('/');
    return this.httpClient.get<any[]>(url, {params}).toPromise();
  }

  getTypes(params: any, category_id?: number | null, strict?: boolean) {
    const url = [AppService.API, 'requests', 'type'].join('/');
    return this.httpClient.get<RequestType[]>(url, {params}).pipe(
      map(types => {
        types.sort((a, b) => {
          return b.id - a.id;
        });

        if (!category_id && !strict) {
          return types;
        }

        return types.filter(type => {
          if (category_id !== null || strict) {
            return type.category_id === category_id
          }
          else {
            return true;
          }
        });
      })
    );
  }

  listStatus(category_id?: number | null, strict?: boolean) {
    const url = [AppService.API, 'requests', 'status'].join('/');
    return this.httpClient.get<RequestStatus[]>(url, { params: { type: 'all' } }).pipe(
      map(statuses => {
        if (!category_id && !strict) {
          return statuses;
        }

        return statuses.filter(status => {
          if (category_id !== null || strict) {
            return status.category_id === category_id
          }
          else {
            return true;
          }
        });
      })
    );
  }

  updateBy(id: number, body, type: string): Promise<any> {
    const url = [AppService.API, 'requests', id, type].join('/');
    return this.httpClient.post<any>(url, body).toPromise();
  }

  updateItems(id, params): Observable<any> {
    const url = [AppService.API, 'requests', id, 'items'].join('/');
    return this.httpClient.put<any>(url, params);
  }

  updateExtendedStatus(id: number, status: Partial<RequestStatus>) {
    const url = [AppService.API, 'requests', 'status', id].join('/');
    return this.httpClient.put<RequestStatus>(url, status);
  }

  updateExtendedType(id: number, type: RequestType) {
    const url = [AppService.API, 'requests', 'type', id].join('/');
    return this.httpClient.put<RequestType>(url, type);
  }

  addItem(id: number, body: any): Observable<any> {
    const url = [AppService.API, 'requests', id, 'item/unit'].join('/');
    return this.httpClient.post<any>(url, body).pipe(
      catchError(err => {
        if (err.error && typeof err.error.message === 'string') {
          if (err.error.message.includes('nonnegative_tri_inventories_quantity')) {
            err.error.message = 'STOCK_NOT_ENOUGH';
          }
        }
        return throwError(err);
      })
    );
  }

  removeItem(id: number, item_id: number): Observable<any> {
    const url = [AppService.API, 'requests', id, 'item', item_id, 'unit'].join('/');
    return this.httpClient.delete<any>(url);
  }

  addItemsByUnit(id, params): Observable<any> {
    const url = [AppService.API, 'requests', id, 'items', 'unit'].join('/');
    return this.httpClient.post<any>(url, params).pipe(
      catchError(err => {
        if (err.error && typeof err.error.message === 'string') {
          if (err.error.message.includes('nonnegative_tri_inventories_quantity')) {
            err.error.message = 'STOCK_NOT_ENOUGH';
          }
        }
        return throwError(err);
      })
    );
  }

  updateItemsByUnit(id, params): Observable<any> {
    const url = [AppService.API, 'requests', id, 'items', 'unit'].join('/');
    return this.httpClient.put<any>(url, params);
  }

  paginate(tableState: TableState, KEY?): Promise<ServerResult> {
    const url = [AppService.API, 'requests', 'paginate'].join('/');
    const params = this._urlParams || {};

    sessionStorage.setItem(KEY || MaintenanceService.TS_KEY, JSON.stringify(tableState));

    return this.httpClient.post<any>(url, tableState, {params}).toPromise();
  }

  removeBy(id: number, type: string, secondId: number): Promise<any> {
    const url = [AppService.API, 'requests', id, type, secondId].join('/');
    return this.httpClient.delete<any>(url).toPromise();
  }

  search(id): Observable<any> {
    const url = [AppService.API, 'requests', id, 'search'].join('/');
    return this.httpClient.get<any>(url);
  }

  sendSMS(id): Promise<any> {
    const url = [AppService.API, 'requests', id, 'sms'].join('/');
    return this.httpClient.get<any>(url).toPromise();
  }

  summary(body: any): Observable<any[]> {
    const params = this._urlParams || {};

    const url = [AppService.API, 'requests', 'summary'].join('/');
    return this.httpClient.post<any[]>(url, body, {params});
  }

  summaryBy(body: any, type?: any): Promise<any[]> {
    const url = [AppService.API, 'requests', type].join('/');
    const params = this._urlParams || {};

    return this.httpClient.post<any[]>(url, body, {params}).toPromise();
  }

  update(request): Observable<Request> {
    const url = [AppService.API, 'requests', request.id].join('/');
    return this.httpClient.put<Request>(url, request);
  }

  updateExtendedBy(id: number, body: any, type: string): Promise<any> {
    const url = [AppService.API, 'requests', id, 'extended', type].join('/');
    return this.httpClient.put<any>(url, body).toPromise();
  }

  updateStatus(params): Observable<any> {
    const url = [AppService.API, 'requests', params.id, 'status'].join('/');
    return this.httpClient.put<Request>(url, params);
  }

  clearFilter(_table: SmartTable<any>, type: string | Array<any>, defaultFilter?: any) {
    let body = {};

    if (typeof type === 'string') {
      body[type] = undefined;

      if (defaultFilter) {
        body[type] = [defaultFilter];
      }
    }
    else {
      type.forEach(item => {
        body[item] = undefined;
      });
    }

    _table.filter(body);
  }

  filterBy(_table: SmartTable<any>, type: string, value: any, operator: FilterOperator, defaultFilter?: any): void {
    const body = {};

    if (type) {
      body[type] = value ? [
        {
          value: value,
          operator: operator,
          type: 'string'
        }
      ] : undefined;

      if (defaultFilter) {
        if (body[type]) {
          body[type].push(defaultFilter);
        }
        else {
          body[type] = [defaultFilter];
        }
      }

      _table.filter(body);
    }
  }

  formatHistoryDescription(history: RequestHistory) {
    let description = '';

    const translated = this.translateService.instant('status.' + history.status_code);

    if (history.status_code === 'ADD' || history.status_code === 'REMOVE' || history.status_code === 'REMOVED') {
      try {
        const items = JSON.parse(history.description);

        for (let i = 0; i < items.length; i++) {
          description += items[i].name + ' ('

          if (history.status_code === 'REMOVE' || history.status_code === 'REMOVED') {
            description += '-';
          }

          description += items[i].quantity + ')';

          if (items.length > 1 && (i + 1) < items.length) {
            description += ' - ';
          }
        }
      }
      catch(e) {
        description = history.description;
      }
    }
    else if (/ADD_ITEM|REMOVE_ITEM/.test(history.status_code)) {
      if (history.meta) {
        description += history.meta.name + ' ('

        if (history.status_code === 'REMOVE_ITEM') {
          description += '-';
        }

        description += history.meta.quantity + ')';
      }
      else {
        description = history.description;
      }

    }
    else if (/(CONTACT_CHANGE|STAFF_CHANGE:REMOVE|STAFF_CHANGE:ADD)/.test(history.status_code)) {
      let name = '';
      try {
        if (history.status_code === 'CONTACT_CHANGE') {
          history.description = history.description.replace(/Previous contact : /g, '');
        }

        const parsed: any = JSON.parse(history.description);
        if (parsed.constructor === Array) {
          if (parsed.length) {
            name = parsed[0].name || '';
          }
          else {
            name = '-';
          }
        }
        else{
          name = parsed.name || '';
        }
      }
      catch(err) {
        name = history.description;
      }

      if (history.status_code === 'CONTACT_CHANGE') {
        name = 'Précédent: ' + name;
      }

      description = `${translated} - ${name}`;
    }
    else if (history.status_code === 'STATUS_UPDATE') {
      description = this.translateService.instant(`status.${history.description}`);
    }
    else if (history.status_code === 'EXTENDED_STATUS_UPDATE') {
      description = `${translated} - Précédent: ${(history.description || '-')}`;
    }
    else if (history.status_code === 'EXTENDED_TYPE_UPDATE') {
      description = `${translated} - Précédent: ${(history.description || '-')}`;
    }
    else {
      try {
        const data = JSON.parse(history.description);
        if (data.constructor === Array) {
          data.forEach((prop, index) => {
            description += this.joinObject(prop);

            if (index < data.length - 1) {
              description += ' | ';
            }
          });
        }
        else {
          description  = this.joinObject(data);
        }
      }
      catch(err) {
        description = history.description;
      }
    }

    return description;
  }

  getLatestHistory(histories: RequestHistory[], excludeDate?: boolean): string {
    let result = '';

    if (histories && histories.length > 0) {
      const item: RequestHistory = _orderBy(histories, ['created_at'], ['desc'])[0];

      result = this.formatHistoryDescription(item);

      if (!excludeDate) {
        result += `<br/> <span class="font-size-11">${moment(item.created_at).format('DD/MM/YYYY HH:mm')}</span>`;
      }
    }

    return result;
  }

  joinObject(o: object) {
    let out = '';
    const keys = Object.keys(o);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      out += k + ': ' + o[k];
      if (i < keys.length - 1) {
        out += ', ';
      }
    }

    return out;
  }

  isMine(request: Request) {
    const session = this.sessionService.getUser();
    const user_id = session ? session.id : null;
    return (request.Staffs || []).find(item => item.id === user_id);
  }

  async translate(text: string) {
    return this.translateService.instant(text);
  }
}
