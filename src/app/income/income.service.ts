import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ServerResult} from 'src/app/_services/smart-table.service';
import {TableState} from 'smart-table-core';

import Contact from '../models/contact';
import Revenue from '../models/revenue';

import {AppService} from '../app.service';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  public static TS_KEY = 'TS_INCOME';

  constructor(private http: HttpClient) {
  }

  create(revenue: Revenue): Observable<Revenue> {
    const url = [AppService.API, 'incomes'].join('/');
    return this.http.post<Revenue>(url, revenue);
  }

  delete(id): Promise<any> {
    const url = [AppService.API, 'incomes', id].join('/');
    return this.http.delete<any>(url).toPromise();
  }

  get(id: number): Observable<Revenue> {
    const url = [AppService.API, 'incomes', id].join('/');
    return this.http.get<Revenue>(url);
  }

  getUntendered(): Promise<any[]> {
    const url = [AppService.API, 'incomes/revenue/untendered'].join('/');
    return this.http.get<any[]>(url).toPromise();
  }

  public getConfig(key?): TableState {
    const search = sessionStorage.getItem(key || IncomeService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: "created_at", direction: "desc"},
      slice: {page: 1, size: 25}
    };
  }

  list(): Observable<(Revenue)[]> {
    const url = [AppService.API, 'incomes'].join('/');
    return this.http.get<(Revenue)[]>(url);
  }

  paginate(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || IncomeService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'incomes', 'paginate'].join('/');
    return this.http.post<ServerResult>(url, tableState).toPromise();
  }

  refundReward(id: number): Promise<any> {
    const url = [AppService.API, 'incomes/revenue', id, 'refundReward'].join('/');
    return this.http.put<any>(url, null).toPromise();
  }

  select(keyword): Observable<Contact[]> {
    const url = [AppService.API, 'contacts', keyword, 'select'].join('/');
    return this.http.get<Contact[]>(url);
  }

  tender(id): Promise<any> {
    const url = [AppService.API, 'incomes/revenue', id, 'tender'].join('/');
    return this.http.put<any>(url, null).toPromise();
  }

  transfer(body): Promise<any> {
    const url = [AppService.API, 'incomes/revenue/transfer'].join('/');
    return this.http.post<any>(url, body).toPromise();
  }

  summary(params?: any): Observable<any[]> {
    const url = [AppService.API, 'incomes', 'summary'].join('/');
    return this.http.post<any[]>(url, params);
  }

  update(revenue: Revenue): Observable<Revenue[]> {
    const url = [AppService.API, 'incomes', revenue['id'], 'revenue'].join('/');
    return this.http.put<Revenue[]>(url, revenue);
  }

}
