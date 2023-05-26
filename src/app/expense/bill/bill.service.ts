import {environment} from '../../../environments/environment';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

import Bill from '../../models/bill';
import BillPayment from '../../models/bill-payment';
import {DisplayedItem} from 'smart-table-core';
import {TableState} from 'smart-table-ng';

import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AppService} from 'src/app/app.service';



interface Summary {
  page: number;
  size: number;
  filteredCount: number;
}

interface ServerResult {
  data: DisplayedItem<Bill>[];
  summary: Summary;
}

@Injectable({
  providedIn: 'root'
})
export class BillService {
  public static TS_KEY = 'TS_BILL';

  constructor(private httpClient: HttpClient, private translateService: TranslateService) {
  }

  addHistory(params): Observable<any> {
    const url = [AppService.API, 'bills', params['id'], 'note'].join('/');
    return this.httpClient.post<any>(url, params);
  }

  addItem(id: number, body: any): Observable<any> {
    const url = [AppService.API, 'bills', id, 'item/unit'].join('/');
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
    const url = [AppService.API, 'bills', id, 'item', item_id, 'unit'].join('/');
    return this.httpClient.delete<any>(url);
  }

  cancel(bill: Bill): Observable<Bill> {
    const url = [AppService.API, 'bills', bill.id].join('/');
    return this.httpClient.delete<Bill>(url);
  }

  cancelWithUnit(bill: Bill): Observable<Bill> {
    const url = [AppService.API, 'bills', bill.id, 'unit'].join('/');
    return this.httpClient.delete<Bill>(url);
  }

  create(bill: Bill): Observable<Bill> {
    const url = [AppService.API, 'bills'].join('/');
    return this.httpClient.post<Bill>(url, bill);
  }

  createWithUnit(bill: Bill): Promise<Bill> {
    const url = [AppService.API, 'bills/units'].join('/');
    return this.httpClient.post<Bill>(url, bill).pipe(
      catchError(err => {
        if (err.error && typeof err.error.message === 'string') {
          if (err.error.message.includes('nonnegative_tri_inventories_quantity')) {
            err.error.message = 'STOCK_NOT_ENOUGH';
          }
        }
        return throwError(err);
      })
    ).toPromise();
  }

  createPayment(bill_id, payment: BillPayment): Observable<BillPayment> {
    const url = [AppService.API, 'bills', bill_id, 'payment'].join('/');
    return this.httpClient.post<BillPayment>(url, payment);
  }

  deleteAttachment(id, docId): Promise<any> {
    const url = [AppService.API, 'bills', id, 'attachment', docId].join('/');
    return this.httpClient.delete<any>(url).toPromise();
  }

  drafts(params?: any): Promise<Bill[]> {
    const url = [AppService.API, 'bills', 'draft'].join('/');
    return this.httpClient.post<Bill[]>(url, params).toPromise();
  }

  get(id): Observable<Bill> {
    const url = [AppService.API, 'bills', id].join('/');
    return this.httpClient.get<Bill>(url);
  }

  getConfig(key?): TableState {
    const search = sessionStorage.getItem(key || BillService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {},
      slice: {page: 1, size: 25}
    };
  }

  list(): Observable<Bill[]> {
    const url = [AppService.API, 'bills'].join('/');
    return this.httpClient.get<Bill[]>(url);
  }

  paginate(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || BillService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'bills', 'paginate'].join('/');
    return this.httpClient.post<ServerResult>(url, tableState).toPromise();
  }

  search(id): Observable<any> {
    const url = [AppService.API, 'bills', id, 'search'].join('/');
    return this.httpClient.get<any>(url);
  }

  summary(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || BillService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'bills', 'summary'].join('/');
    return this.httpClient.post<ServerResult>(url, tableState).toPromise();
  }

  reportSummary(type, date?): Promise<any[]> {
    const url = [AppService.API, 'bills/summary', type].join('/');
    return this.httpClient.post<any[]>(url, date).toPromise();
  }

  update(bill: Bill): Observable<Bill> {
    const url = [AppService.API, 'bills', bill['id']].join('/');
    return this.httpClient.put<Bill>(url, bill);
  }

  updateWithUnit(bill: Bill): Observable<Bill> {
    const url = [AppService.API, 'bills/units', bill.id].join('/');
    return this.httpClient.put<Bill>(url, bill);
  }

  updateInfo(bill: Partial<Bill>) {
    const url = [AppService.API, 'bills', bill.id, 'info'].join('/');
    return this.httpClient.put(url, bill);
  }

  updateStatus(bill: Bill, params): Observable<any> {
    const url = [AppService.API, 'bills', bill.id, 'status'].join('/');
    return this.httpClient.post<any>(url, params);
  }
}

