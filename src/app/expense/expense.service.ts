import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import Expense from '../models/expense';
import {TableState} from 'smart-table-ng';
import {DisplayedItem} from 'smart-table-core';
import Contact from '../models/contact';
import {AppService} from '../app.service';

interface Summary {
  page: number;
  size: number;
  filteredCount: number;
}

interface ServerResult {
  data: DisplayedItem<Expense>[];
  summary: Summary;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  public static TS_KEY = 'TS_EXPENSE';

  constructor(private httpClient: HttpClient) {
  }

  create(expense: Expense): Observable<Expense> {
    const url = [AppService.API, 'expenses'].join('/');
    return this.httpClient.post<Expense>(url, expense);
  }

  delete(id): Promise<any> {
    const url = [AppService.API, 'expenses', id].join('/');
    return this.httpClient.delete<any>(url).toPromise();
  }

  get(id: number): Observable<Expense> {
    const url = [AppService.API, 'expenses', id].join('/');
    return this.httpClient.get<Expense>(url);
  }

  getConfig(key?): TableState {
    const search = sessionStorage.getItem(key || ExpenseService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: "created_at", direction: "desc"},
      slice: {page: 1, size: 25}
    };
  }

  list(): Observable<(Expense)[]> {
    const url = [AppService.API, 'expenses'].join('/');
    return this.httpClient.get<(Expense)[]>(url);
  }

  paginate(tableState: TableState, key?): Promise<ServerResult> {
    sessionStorage.setItem(key || ExpenseService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'expenses', 'paginate'].join('/');
    return this.httpClient.post<ServerResult>(url, tableState).toPromise();
  }

  select(keyword): Observable<Contact[]> {
    const url = [AppService.API, 'contacts', keyword, 'select'].join('/');
    return this.httpClient.get<Contact[]>(url);
  }

  summary(params?: any): Observable<any[]> {
    const url = [AppService.API, 'expenses', 'summary'].join('/');
    return this.httpClient.post<any[]>(url, params);
  }

  summaryBy(type, date?): Promise<any[]> {
    const url = `${AppService.API}/expenses/summary/${type}`;
    return this.httpClient.post<any[]>(url, date).toPromise();
  }

  update(id, body): Promise<Expense> {
    const url = [AppService.API, 'expenses', id].join('/');
    return this.httpClient.put<Expense>(url, body).toPromise();
  }
}
