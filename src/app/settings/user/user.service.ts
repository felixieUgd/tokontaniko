import {environment} from 'src/environments/environment';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {TableState} from 'smart-table-core';
import {ServerResult} from '../../_services/smart-table.service';
import User from '../../models/user';
import {AppService} from 'src/app/app.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public static TS_KEY = 'TS_USER';

  constructor(private http: HttpClient) {
  }

  create(body): Promise<User> {
    const url = [AppService.API, 'users'].join('/');
    return this.http.post<User>(url, body).toPromise();
  }

  createEvent(id, body): Promise<User> {
    const url = [AppService.API, 'users', id, 'event'].join('/');
    return this.http.post<User>(url, body).toPromise();
  }

  deleteAttachment(id, docId): Promise<any> {
    const url = [AppService.API, 'users', id, 'attachment', docId].join('/');
    return this.http.delete<any>(url).toPromise();
  }

  find(term): Observable<User> {
    const url = [AppService.API, 'users', term, 'search'].join('/');
    return this.http.get<User>(url);
  }

  get(id): Observable<User> {
    const url = [AppService.API, 'users', id].join('/');
    return this.http.get<User>(url);
  }

  getConfig = (KEY?): TableState => {
    const search = sessionStorage.getItem(KEY || UserService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {},
      slice: {page: 1, size: 25}
    };
  }

  list(): Observable<User[]> {
    const url = [AppService.API, 'users'].join('/');
    return this.http.get<User[]>(url);
  }

  paginate(tableState: TableState, KEY?): Promise<ServerResult> {
    sessionStorage.setItem(KEY || UserService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'users', 'paginate'].join('/');
    return this.http.post<any>(url, tableState).toPromise();
  }

  select(term, type?): Promise<User[] | any> {
    const url = [AppService.API, 'users', term, (type || 'select')].join('/');
    return this.http.get<User[] | any>(url).toPromise();
  }

  update(user: any): Observable<User> {
    const url = [AppService.API, 'users', user['id']].join('/');
    return this.http.put<User>(url, user);
  }

  updateGeography(id: number, body) {
    const url = [AppService.API, 'users', id, 'geography'].join('/');
    return this.http.put(url, body).toPromise();
  }

  updatePassword(id, body): Observable<User> {
    const url = [AppService.API, 'users', id, 'password'].join('/');
    return this.http.put<User>(url, body);
  }

  updateProfile(id, body): Promise<User> {
    const url = [AppService.API, 'users', id, 'profile'].join('/');
    return this.http.put<User>(url, body).toPromise();
  }

  updateRole(user: User): Observable<User> {
    const url = [AppService.API, 'users', user['id'], 'role'].join('/');
    return this.http.put<User>(url, user);
  }

}
