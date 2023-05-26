import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ServerResult} from '../_services/smart-table.service';
import {TableState} from 'smart-table-ng';
import {Subject} from 'rxjs';

import * as moment from 'moment';
import Contact from '../models/contact';
import Facility from '../models/facility';
import Geography from '../models/geograhy';
import {ACCIDENT_TYPES, GEOGRAPHY_TYPES, SCHOOL_GRADES} from '../shared/config/men.config';
import {SettingsCompanyService} from '../settings/company/settings-company.service';
import {AppService} from '../app.service';

import {FilterOperator} from 'smart-table-filter';


export class MenContactType {
  public static FATHER = 'FATHER';
  public static MOTHER = 'MOTHER';
  public static OFFICER = 'OFFICER';
  public static TUTOR = 'TUTOR';
  public static STUDENT = 'STUDENT';
  public static WARRANT = 'WARRANT';
  public static WITNESS = 'WITNESS';
}

@Injectable({
  providedIn: 'root'
})
export class MenService {
  public static TS_KEY = 'TS_MEN';
  public sidePanelFacility = new Subject<boolean>();
  public facility = new Subject<Facility>();
  public accidentTypes = ACCIDENT_TYPES;
  public geographyTypes = GEOGRAPHY_TYPES;
  public grades = SCHOOL_GRADES;

  private _urlParams: HttpParams = null;

  constructor(private httpClient: HttpClient) {
  }

  set urlParams(params: any) {
    this._urlParams = params ? new HttpParams({fromObject: params}) : new HttpParams();
  }

  create(body): Promise<Facility> {
    const url = [AppService.API, 'facilities'].join('/');
    return this.httpClient.post<Facility>(url, body).toPromise();
  }

  createType(body: any) {
    const url = [AppService.API, 'facilities', 'type'].join('/');
    return this.httpClient.post<any>(url, body).toPromise();
  }

  deleteAttachment(id, docId): Promise<any> {
    const url = [AppService.API, 'facilities', id, 'attachment', docId].join('/');
    return this.httpClient.delete<Facility>(url).toPromise();
  }

  get(id): Promise<Facility> {
    const url = [AppService.API, 'facilities', id].join('/');
    return this.httpClient.get<Facility>(url).toPromise();
  }

  getConfig = (KEY?): TableState => {
    const search = sessionStorage.getItem(KEY || MenService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  };

  getInvoiceGroupConfig = (KEY: string): TableState => {
    const search = sessionStorage.getItem(KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {
        created_at: [
          {
            value: moment().startOf('year').startOf('day').format(),
            operator: 'gte',
            type: 'string'
          },
          {
            value: moment().endOf('day').format(),
            operator: 'lte',
            type: 'string'
          }
        ]
      },
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  };

  getInvoiceSummaryConfig = (KEY: string): TableState => {
    const search = sessionStorage.getItem(KEY);
    return search ? JSON.parse(search) : {
      search: {},
      sort: {
        pointer: 'created_at',
        direction: 'desc'
      },
      filter: {
        invoiced_at: [
          {
            value: moment().startOf('day').format(),
            operator: FilterOperator.GREATER_THAN_OR_EQUAL,
            type: 'string'
          },
          {
            value: moment().endOf('day').format(),
            operator: FilterOperator.LOWER_THAN_OR_EQUAL,
            type: 'string'
          }
        ]
      },
      slice: {
        page: 1,
        size: 100
      }
    }
  }

  getRequestConfig = (KEY: string): TableState => {
    const search = sessionStorage.getItem(KEY);
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));

    return search ? JSON.parse(search) : {
      search: {},
      filter: {
        /* type: [
          {
            value: 'INSURANCE',
            operator: 'equals',
            type: 'number'
          }
        ] */
      },
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  };

  getType(id: number) {
    const url = [AppService.API, 'facilities', 'type', id].join('/');
    return this.httpClient.get<any>(url).toPromise();
  }

  getWarrants(contacts:Contact[], type:string): Contact[] {
    let filtered = contacts.filter(item => {
      if (item['RequestContacts'].meta) {
        return item['RequestContacts'].meta.type === MenContactType.WARRANT;
      }

      return false;
    });

    let result = [];

    filtered.forEach(item => {
      if (item.meta) {
        item.meta.id_cin_issued_date = item.meta.id_cin_issued_date ? moment(item.meta.id_cin_issued_date).toDate() : null;
        // item.meta.id_cin_delivered_at = item.meta.id_cin_delivered_at ? item.meta.id_cin_delivered_at : null;
      }

      result.push(item);
    });

    return result;
  }

  listType() {
    const url = [AppService.API, 'facilities', 'type'].join('/');
    return this.httpClient.get<any[]>(url);
  }

  paginate(tableState: TableState, KEY?): Promise<ServerResult> {
    const params = this._urlParams || {};

    sessionStorage.setItem(KEY || MenService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'facilities', 'paginate'].join('/');
    return this.httpClient.post<any>(url, tableState, {params}).toPromise();
  }

  paginateByUserGeography(tableState: TableState, KEY?): Promise<ServerResult> {
    const params = this._urlParams || {};

    sessionStorage.setItem(KEY || MenService.TS_KEY, JSON.stringify(tableState));

    if (tableState.filter && tableState.filter['code']) {
      const codeFilter = tableState.filter['code'][0];
      if (codeFilter && codeFilter.operator === 'like') {
        codeFilter.value = (codeFilter.value || '') + '%';
      }
    }

    const url = [AppService.API, 'facilities', 'paginateByUserGeography'].join('/');
    return this.httpClient.post<any>(url, tableState, {params}).toPromise();
  }

  search(params): Promise<Facility> {
    const url = [AppService.API, 'facilities', params.id, params.action].join('/');
    return this.httpClient.get<Facility>(url).toPromise();
  }

  select(keyword: string) {
    const url = [AppService.API, 'facilities', keyword, 'select'].join('/');
    return this.httpClient.get<Facility[]>(url);
  }

  update(id, body): Promise<Facility> {
    const url = [AppService.API, 'facilities', id].join('/');
    return this.httpClient.put<Facility>(url, body).toPromise();
  }

  updateContact(id, body): Promise<any> {
    const url = [AppService.API, 'facilities', id, 'updateContact'].join('/');
    return this.httpClient.put<any>(url, body).toPromise();
  }

  updateFacility(value: Facility) {
    this.facility.next(value);
  }

  updateSidePanel(value: any) {
    this.sidePanelFacility.next(value);
  }

  updateType(id: number, body: any) {
    const url = [AppService.API, 'facilities', 'type', id].join('/');
    return this.httpClient.put<any>(url, body).toPromise();
  }

  //  Utilities
  getContactByType(contacts:Contact[], type:string): Contact {
    let result:any = contacts.find(item => {
      if (item['RequestContacts'].meta) {
        return item['RequestContacts'].meta.type === type;
      }

      return false;
    });

    if (result !== undefined) {
      if (result.meta) {
        result.bio_dob = result.bio_dob ? moment(result.bio_dob, 'YYYY-MM-DD').toDate() : null;
        result.meta.id_cin_issued_date = result.meta.id_cin_issued_date ? moment(result.meta.id_cin_issued_date).toDate() : null;
        // result.meta.id_cin_delivered_at = result.meta.id_cin_delivered_at ? result.meta.id_cin_delivered_at : null;
      }
      return new Contact(result);
    }

    return null;
  }

  getGeographies(type: 'RGN' | 'DST' | 'CMN'): Promise<Geography[]> {
    const url = [AppService.API, 'geographies'].join('/');
    return this.httpClient.get<Geography[]>(url, { params: { type } }).toPromise();
  }
}
