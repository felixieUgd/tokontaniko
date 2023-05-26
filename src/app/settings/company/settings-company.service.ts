import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import Company from 'src/app/models/company';
import {environment} from 'src/environments/environment';

import {SessionService} from 'src/app/_services/session.service';
import {AppService} from 'src/app/app.service';



@Injectable({
  providedIn: 'root'
})
export class SettingsCompanyService {
  public static KEY = 'TS_COMPANY_SETTINGS';

  constructor(private http: HttpClient,
    private session: SessionService) {
  }

  get(id): Observable<Company> {
    const url = [AppService.API, 'companies', id].join('/');
    return this.http.get<Company>(url);
  }

  getCompanyDefaultSettings(key) {
    const session = sessionStorage.getItem(SettingsCompanyService.KEY);
    return session ? JSON.parse(session)[key] : null;
  }

  getSettings(id: number, fields?: any[]) {
    const url = [AppService.API, 'companies', id, 'settings'].join('/');

    if (fields) {
      return this.http.post<any>(url, { fields });
    }
    else {
      return this.http.get<any>(url);
    }
  }

  list(isList?: boolean): Observable<Company[]> {
    const url = isList ? [AppService.API, 'companies/list'].join('/') : [AppService.API, 'companies'].join('/');
    return this.http.get<Company[]>(url);
  }

  create(company: Company): Observable<Company> {
    const url = [AppService.API, 'companies'].join('/');
    return this.http.post<Company>(url, company);
  }

  switch(company_id): Observable<any> {
    const url = [AppService.API, company_id, 'switch'].join('/');
    return this.http.get(url);
  }

  update(company: Company): Observable<Company> {
    const url = [AppService.API, 'companies', this.session.getCompanyId()].join('/');
    return this.http.put<Company>(url, company);
  }
}
