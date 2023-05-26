import {environment} from '../../../environments/environment';
import {Injectable} from '@angular/core';
import {HttpBackend, HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {TableState} from 'smart-table-core';
import {FilterOperator} from 'smart-table-core';
import {ServerResult} from 'src/app/_services/smart-table.service';

import _filter from 'lodash.filter';
import _forEach from 'lodash.foreach';
import _sumBy from 'lodash.sumby';

import Invoice, {InvoiceItem} from 'src/app/models/invoice';
import InvoicePayment from 'src/app/models/invoice-payment';
import InvoiceGroup from 'src/app/models/invoice-group';
import Currency from 'src/app/models/currency';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AppService} from 'src/app/app.service';

const DEFAULT_CURRENCY = 'MGA';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  public static TS_KEY = 'TS_INVOICE';

  constructor(private httpBackend: HttpBackend,
              private httpClient: HttpClient) {
  }

  addHistory(params): Observable<any> {
    const url = [AppService.API, 'invoices', params['id'], 'note'].join('/');
    return this.httpClient.post<any>(url, params);
  }

  addItem(id: number, body: any): Observable<any> {
    const url = [AppService.API, 'invoices', id, 'item/unit'].join('/');
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

  allRevenue(body): Promise<any> {
    const url = [AppService.API, 'reports', 'allRevenue'].join('/');
    return this.httpClient.post<any>(url, body).toPromise();
  }

  getConfig = (key?): TableState => {
    const search = sessionStorage.getItem(key || InvoiceService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  };

  cancel(invoice: Invoice): Observable<Invoice> {
    const url = [AppService.API, 'invoices', invoice.id].join('/');
    return this.httpClient.delete<Invoice>(url);
  }

  cancelWithUnit(invoice: Invoice): Observable<Invoice> {
    const url = [AppService.API, 'invoices', invoice.id, 'unit'].join('/');
    return this.httpClient.delete<Invoice>(url);
  }

  cashReward(id, body): Observable<any> {
    const url = [AppService.API, 'invoices', id, 'payment/reward'].join('/');
    return this.httpClient.post<any>(url, body);
  }

  create(invoice: Invoice): Observable<Invoice> {
    const url = [AppService.API, 'invoices'].join('/');
    return this.httpClient.post<Invoice>(url, invoice).pipe(
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

  createGroup(body): Promise<any> {
    const url = [AppService.API, 'invoices/group'].join('/');
    return this.httpClient.post<any>(url, body).toPromise();
  }

  createPayment(payment: InvoicePayment): Observable<InvoicePayment> {
    const url = [AppService.API, 'invoices', payment['invoice_id'], 'payment'].join('/');
    return this.httpClient.post<InvoicePayment>(url, payment);
  }

  createWithUnit(invoice: Invoice): Promise<Invoice> {
    const url = [AppService.API, 'invoices/units'].join('/');
    return this.httpClient.post<Invoice>(url, invoice).toPromise();
  }

  drafts(params?: any): Promise<Invoice[]> {
    const url = [AppService.API, 'invoices', 'draft'].join('/');
    return this.httpClient.post<Invoice[]>(url, params).toPromise();
  }

  drop(invoiceGroupId, invoiceId) {
    const url = [AppService.API, 'invoices/group', invoiceGroupId, 'dropInvoice', invoiceId].join('/');
    return this.httpClient.put<any>(url, {}).toPromise();
  }

  get(id): Observable<Invoice> {
    const url = [AppService.API, 'invoices', id].join('/');
    return this.httpClient.get<Invoice>(url);
  }

  getNoScope(id): Observable<Invoice> {
    const url = [AppService.API, 'invoices', id, 'noScope'].join('/');
    return this.httpClient.get<Invoice>(url);
  }

  getGroup(id): Promise<any> {
    const url = [AppService.API, 'invoices/group', id].join('/');
    return this.httpClient.get<any>(url).toPromise();
  }

  invoicePrint(id): Promise<any> {
    const url = [AppService.API, 'invoices', id, 'print'].join('/');
    return this.httpClient.get<any>(url).toPromise();
  }

  invoiceGroupPrint(id): Promise<any> {
    const url = [AppService.API, 'invoices/group', id, 'print'].join('/');
    return this.httpClient.get<any>(url).toPromise();
  }

  invoiceMail(id): Promise<any> {
    const url = [AppService.API, 'invoices', id, 'email'].join('/');
    return this.httpClient.post<any>(url, null).toPromise();
  }

  list(): Observable<Invoice[]> {
    const url = [AppService.API, 'invoices'].join('/');
    return this.httpClient.get<Invoice[]>(url);
  }

  paginate(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || InvoiceService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'invoices/paginate'].join('/');
    return this.httpClient.post<ServerResult>(url, tableState).toPromise();
  }

  paginateGroup(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || InvoiceService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'invoices/group/paginate'].join('/');
    return this.httpClient.post<ServerResult>(url, tableState).toPromise();
  }

  listGroupByDate(body: any): Promise<any[]> {
    const url = [AppService.API, 'invoices/group/byDate'].join('/');
    return this.httpClient.post<any[]>(url, body).toPromise();
  }

  removeItem(id: number, item_id: number): Observable<any> {
    const url = [AppService.API, 'invoices', id, 'item', item_id, 'unit'].join('/');
    return this.httpClient.delete<any>(url);
  }

  scanManifest(id): Promise<any> {
    const url = [AppService.API, 'invoices', id, 'forManifest'].join('/');
    return this.httpClient.get<any>(url).toPromise();
  }

  search(id): Observable<any> {
    const url = [AppService.API, 'invoices', id, 'search'].join('/');
    return this.httpClient.get<any>(url);
  }

  summary(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || InvoiceService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'invoices', 'summary'].join('/');
    return this.httpClient.post<ServerResult>(url, tableState).toPromise();
  }

  transfer(id, body): Promise<any> {
    const url = [AppService.API, 'invoices/group', id, 'transfer'].join('/');
    return this.httpClient.put<any>(url, body).toPromise();
  }

  unclaimedReport(body): Promise<Invoice[]> {
    const url = [AppService.API, 'reports/unclaimed'].join('/');
    return this.httpClient.post<Invoice[]>(url, body).toPromise();
  }

  update(invoice: Invoice): Observable<Invoice> {
    const url = [AppService.API, 'invoices', invoice['id']].join('/');
    return this.httpClient.put<Invoice>(url, invoice);
  }

  updateInfo(invoice: Partial<Invoice>) {
    const url = [AppService.API, 'invoices', invoice.id, 'info'].join('/');
    return this.httpClient.put(url, invoice);
  }

  updateItem(id, body): Observable<any> {
    const url = [AppService.API, 'invoices', id, 'itemMeta'].join('/');
    return this.httpClient.put<any>(url, body);
  }

  updateItemWithUnit(id: number, item_id: number, body: any) {
    const url = [AppService.API, 'invoices', id, 'item', item_id, 'unit'].join('/');
    return this.httpClient.put<any>(url, body);
  }

  updateGroup(id, body): Promise<InvoiceGroup> {
    const url = [AppService.API, 'invoices/group', id].join('/');
    return this.httpClient.put<InvoiceGroup>(url, body).toPromise();
  }

  updateMeta(id, body): Promise<Invoice> {
    const url = [AppService.API, 'invoices', id, 'meta'].join('/');
    return this.httpClient.put<Invoice>(url, body).toPromise();
  }

  updateStatus(invoice: Invoice, params): Observable<any> {
    const url = [AppService.API, 'invoices', invoice.id, 'status'].join('/');
    return this.httpClient.post<any>(url, params);
  }

  getPaymentDue = (invoiceItems: InvoiceItem[], extra?: any[]): number => {

    return _sumBy(invoiceItems, (item) => {
      return item.quantity * item.price;
    });
  };

  getTotalDiscount(invoiceItems: InvoiceItem[]): number {
    let amount = 0;

    _forEach(invoiceItems, item => {
      amount += _sumBy(item.Taxes, (tax) => {
        if (tax.type === 'DISCOUNT') {
          return (item.price * item.quantity) * tax.rate / 100;
        } else {
          return 0;
        }
      });
    });

    return amount;
  }

  getTotalPayment(invoice: Invoice): number {
    return _sumBy(invoice.Revenues, (revenu) => {
      if (revenu.currency_code === DEFAULT_CURRENCY) {
        return revenu.amount;
      }
      else {
        return revenu.amount / (revenu.currency_rate || 1);
      }
    });
  }

  getTotalTax(items: any[]): number {
    return _sumBy(items, item => {
      return _sumBy(item.Taxes, (tax) => {
        if (tax.type === 'FIXED') {
          return item.quantity * tax.rate;
        }
        else if (tax.type !== 'DISCOUNT' && tax.type !== 'OTHER') {
          return (item.price * item.quantity) * tax.rate / 100;
        }
        else {
          return 0;
        }
      });
    });
  }

  getTotalPaymentCurrency(invoice: Invoice, currency?: Currency) {
    return _sumBy(invoice.Revenues, (revenu) => {
      return (revenu.currency_code === currency.code) ? revenu.amount : 0;
    });
  }

  getTotalPaymentExtra(invoice: Invoice) {
    if (invoice.InvoiceItems.length > 0) {
      return _sumBy(invoice.Revenues, (revenu) => {
        return (revenu.currency_code === DEFAULT_CURRENCY && revenu.amount > 0) ? revenu.amount : 0;
      });
    }

    return 0;
  }

  updateWithUnit(invoice: Invoice): Observable<Invoice> {
    const url = [AppService.API, 'invoices/units', invoice.id].join('/');
    return this.httpClient.put<Invoice>(url, invoice);
  }
}
