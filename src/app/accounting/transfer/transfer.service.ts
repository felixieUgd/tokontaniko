import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from 'src/environments/environment';
import {Observable} from 'rxjs/Observable';

import {TableState} from 'smart-table-core';

import Transfer from 'src/app/models/transfer';
import {ServerResult} from 'src/app/_services/smart-table.service';
import {Subject} from 'rxjs';
import {AppService} from 'src/app/app.service';

const TS_KEY = 'TS_TRANSFER';


@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private _sidePanelTransfer = new Subject<boolean>();
  private _sidePanelProperties = new Subject<any>();

  constructor(private http: HttpClient) {
  }

  public get sidePanelProperties() {
    return this._sidePanelProperties;
  }

  public get sidePanelTransfer() {
    return this._sidePanelTransfer;
  }

  public setSidePanelProperties(value: any) {
    this._sidePanelTransfer.next(true);
    this._sidePanelProperties.next(value);
  }

  public setSidePanelTransfer(value: boolean) {
    this._sidePanelTransfer.next(value);
  }

  create(body: any): Observable<Transfer> {
    const url = [AppService.API, 'transfers'].join('/');
    return this.http.post<Transfer>(url, body);
  }

  get(id): Observable<Transfer> {
    const url = [AppService.API, 'transfers', id].join('/');
    return this.http.get<Transfer>(url);
  }

  getConfig(): TableState {
    const search = sessionStorage.getItem(TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: 'created_at', direction: 'desc'},
      slice: {page: 1, size: 25}
    };
  }

  list(params?: any): Observable<Transfer[]> {
    const url = [AppService.API, 'transfers'].join('/');
    return this.http.get<Transfer[]>(url, {params: params});
  }

  paginate(tableState: TableState): Observable<ServerResult> {
    sessionStorage.setItem(TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'transfers', 'paginate'].join('/');
    return this.http.post<any>(url, tableState);
  }

  update(transfer: Transfer): Observable<Transfer> {
    const url = [AppService.API, 'transfers', transfer.id].join('/');
    return this.http.put<Transfer>(url, transfer);
  }
}
