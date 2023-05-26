import {HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {AppService} from 'src/app/app.service';
import Geography from 'src/app/models/geograhy';

@Injectable({
  providedIn: 'root'
})
export class SettingsGeographyService {

  constructor(private httpClient: HttpClient) { }

  create(geography: Partial<Geography>) {
    const url = [AppService.API, 'geographies'].join('/');
    return this.httpClient.post<Geography>(url, geography);
  }

  list(type: 'RGN' | 'DST' | 'CMN'): Promise<Geography[]> {
    const url = [AppService.API, 'geographies'].join('/');
    return this.httpClient.get<Geography[]>(url, {params: {type}}).toPromise();
  }

  get(id: number) {
    const url = [AppService.API, 'geographies', id].join('/');
    return this.httpClient.get<Geography>(url);
  }

  update(geography: Partial<Geography>) {
    const url = [AppService.API, 'geographies', geography.id].join('/');
    return this.httpClient.put(url, geography);
  }
}