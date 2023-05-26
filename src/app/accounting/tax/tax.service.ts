import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

import Tax from 'src/app/models/tax';
import {AppService} from 'src/app/app.service';



@Injectable({
  providedIn: 'root'
})
export class TaxService {
  
  constructor(private http: HttpClient) {
  }

  create(role: Tax): Observable<Tax> {
    const url = [AppService.API, 'taxes'].join('/');
    return this.http.post<Tax>(url, role);
  }

  get(id): Observable<Tax> {
    const url = [AppService.API, 'taxes', id].join('/');
    return this.http.get<Tax>(url);
  }

  list(params?: any): Observable<Tax[]> {
    const url = [AppService.API, 'taxes'].join('/');
    return this.http.get<Tax[]>(url, {params: params});
  }

  update(role: Tax): Observable<Tax> {
    const url = [AppService.API, 'taxes', role.id].join('/');
    return this.http.put<Tax>(url, role);
  }
}
