import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from 'src/environments/environment';
import {Observable} from 'rxjs/Observable';

import Company from 'src/app/models/company';
import {Subject} from 'rxjs';
import {AppService} from '../app.service';



@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  public sidePanelFacilityAdd$ = new Subject<any>();

  constructor(private http: HttpClient) {
  }

  get(id): Observable<Company> {
    const url = [AppService.API, 'companies', id].join('/');
    return this.http.get<Company>(url);
  }

  updateSidePanelFacilityAdd(value: any) {
    this.sidePanelFacilityAdd$.next(value);
  }
}
