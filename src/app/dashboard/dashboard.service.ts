import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {environment} from 'src/environments/environment';
import Announcement from '../models/announcement';
import {AppService} from '../app.service';



@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) {
  }

  //  params: {type: reportType}
  getBalanceReports(params, body): Promise<any> {
    const url = [AppService.API, 'reports'].join('/');
    return this.http.post<any>(url, body, {params}).toPromise();
  }

  getAnnouncement(id): Promise<Announcement> {
    const url = [AppService.API, 'announcements', id].join('/');
    return this.http.get<Announcement>(url).toPromise();
  }

  getNewFeeds(): Promise<Announcement[]> {
    const url = [AppService.API, 'announcements'].join('/');
    return this.http.get<Announcement[]>(url).toPromise();
  }

  getReport(params, body): Promise<any> {
    const url = [AppService.API, 'reports'].join('/');
    return this.http.post<any>(url, body, {params}).toPromise();
  }

  createAnnouncement(body): Promise<any> {
    const url = [AppService.API, 'announcements'].join('/');
    return this.http.post<any>(url, body).toPromise();
  }

  signAnnouncement(id, body): Promise<any> {
    const url = [AppService.API, 'announcements', id, 'sign'].join('/');
    return this.http.put<any>(url, body).toPromise();
  }

  updateAnnouncement(id, body): Promise<any> {
    const url = [AppService.API, 'announcements', id].join('/');
    return this.http.put<any>(url, body).toPromise();
  }
}
