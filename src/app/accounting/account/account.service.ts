import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from 'src/environments/environment';
import {Observable} from 'rxjs/Observable';

import Account from 'src/app/models/account';
import {AppService} from 'src/app/app.service';


const API_BOX = environment.apiBox;

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private http: HttpClient) {
  }

  assignCard(id, body): Promise<any> {
    const url = [API_BOX, id].join('/');
    return this.http.post<any>(url, body).toPromise();
  }

  create(account: Account): Observable<Account> {
    const url = [AppService.API, 'accounts'].join('/');
    return this.http.post<Account>(url, account);
  }

  get(id): Observable<Account> {
    const url = [AppService.API, 'accounts', id].join('/');
    return this.http.get<Account>(url);
  }

  list(params?: any): Observable<Account[]> {
    const url = [AppService.API, 'accounts'].join('/');
    return this.http.get<Account[]>(url, {params: params});
  }

  searchByCard(cardUid): Promise<Account> {
    const url = [AppService.API, 'accounts', cardUid, 'search'].join('/');
    return this.http.get<Account>(url).toPromise();
  }

  select(term): Observable<Account[]> {
    const url = [AppService.API, 'accounts', term, 'select'].join('/');
    return this.http.get<Account[]>(url);
  }

  update(account: Account): Observable<Account> {
    const url = [AppService.API, 'accounts', account.id].join('/');
    return this.http.put<Account>(url, account);
  }
}
