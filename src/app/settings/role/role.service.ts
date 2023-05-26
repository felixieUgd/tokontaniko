import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import Role from 'src/app/models/role';
import {AppService} from 'src/app/app.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(private http: HttpClient) {
  }

  create(role: Role): Observable<Role> {
    const url = [AppService.API, 'roles'].join('/');
    return this.http.post<Role>(url, role);
  }

  get(id): Observable<any> {
    const url = [AppService.API, 'roles', id].join('/');
    return this.http.get<any>(url);
  }

  list(): Observable<Role[]> {
    const url = [AppService.API, 'roles'].join('/');
    return this.http.get<Role[]>(url);
  }

  getWithUsers(id: number) {
    const url = [AppService.API, 'roles', id, 'user'].join('/');
    return this.http.get<Role>(url);
  }

  update(role: Role): Observable<Role> {
    const url = [AppService.API, 'roles', role.id].join('/');
    return this.http.put<Role>(url, role);
  }

  updateMenu(id, body: any): Promise<any> {
    const url = [AppService.API, 'roles', id, 'menu'].join('/');
    return this.http.put<any>(url, body).toPromise();
  }

  sendSMSRole(smsContent: string, type: 'cash_desk' | 'sp'): Observable<any> {
    const url = `${AppService.API}/sms/role/${type}`;
    return this.http.post<any>(url, {message: smsContent});
  }
}
