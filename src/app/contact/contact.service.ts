import {ActivatedRoute} from '@angular/router';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

import Contact from 'src/app/models/contact';
import Reward from '../models/reward';
import {environment} from 'src/environments/environment';

import {TableState} from 'smart-table-core';
import {ServerResult} from 'src/app/_services/smart-table.service';
import {AppService} from '../app.service';



@Injectable({
  providedIn: 'root'
})
export class ContactService {
  public static TS_KEY = 'TS_CONTACT';

  constructor(private http: HttpClient) {
  }

  checkVerificationCode(id, body): Promise<any> {
    const url = [AppService.API, 'contacts', id, 'verify'].join('/');
    return this.http.post<any>(url, body).toPromise();
  }

  create(customer: Contact): Observable<Contact> {
    const url = [AppService.API, 'contacts'].join('/');
    return this.http.post<Contact>(url, customer);
  }

  deleteAttachment(contactId, docId): Promise<any> {
    const url = [AppService.API, 'contacts', contactId, 'attachment', docId].join('/');
    return this.http.delete<any>(url).toPromise();
  }

  find(term, params?): Observable<Contact> {
    const url = [AppService.API, 'contacts', term, 'search'].join('/');
    return this.http.get<Contact>(url, {params: params});
  }

  get(id): Observable<Contact> {
    const url = [AppService.API, 'contacts', id].join('/');
    return this.http.get<Contact>(url);
  }

  getCompletionRate(contact: Contact) {
    let point = 0;
    let coeff = 0;

    if (contact) {
      coeff += 2;

      if (contact.phone) { point++; }
      if (contact.email) { point++; }

      if (contact.is_business) {
        coeff += 6;

        if (contact.meta) {
          if (contact.meta.nif) { point++; }
          if (contact.meta.stat) { point++; }
          if (contact.meta.rcs) { point++; }
          if (contact.meta.name) { point++; }
          if (contact.meta.phone) { point++; }
          if (contact.meta.address) { point++; }
        }
      }
      else {
        coeff += 3;

        if (contact.id_cin) { point++; }
        if (contact.id_passport) { point++; }
        if (contact.sex) { point++; }

        /* if (contact.meta) {
          if (contact.meta.name) { point++; }
          if (contact.meta.phone) { point++; }
          if (contact.meta.address) { point++; }
        } */
      }
    }

    return Math.round(point * 100 / coeff);
  }

  getCustomerReward(rewards: Reward[], customer: Contact): Reward {
    let selected_reward = new Reward({
      code: 'REGULAR',
      points_threshold: 0
    });

    for (let i = rewards.length - 1; i >= 0; i--) {
      if (selected_reward.points_threshold < rewards[i].points_threshold) {
        if (customer.points_accumulated === rewards[i].points_threshold) {
          selected_reward =  rewards[i];
          break;
        }
        else if (customer.points_accumulated > rewards[i].points_threshold) {
          selected_reward =  rewards[i];

          if (i > 0 && customer.points_accumulated < rewards[i - 1].points_threshold) {
            selected_reward =  rewards[i];
            break;
          }
        }
      }
    }

    return selected_reward;
  }

  getInvoices(tableState: TableState, activatedRoute: ActivatedRoute, type): Promise<any> {
    const id = activatedRoute.snapshot.params.id;
    const url = [AppService.API, 'contacts', id, type].join('/');
    return this.http.post<any>(url, tableState).toPromise();
  }

  getRewarded(id?, action?): Promise<Contact[]> {
    const url = [AppService.API, 'contacts', id, action].join('/');
    return this.http.get<Contact[]>(url).toPromise();
  }

  getRewards(): Observable<Reward[]> {
    const url = [AppService.API, 'rewards'].join('/');
    return this.http.get<Reward[]>(url);
  }

  getConfig = (): TableState => {
    const search = sessionStorage.getItem(ContactService.TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: 'name', direction: 'asc'},
      slice: {page: 1, size: 25}
    };
  };

  getOverview(id: number): Promise<any> {
    const url = [AppService.API, 'contacts', id, 'overview'].join('/');
    return this.http.get<any>(url).toPromise();
  }

  itemSummary(id): Promise<any> {
    const url = [AppService.API, 'contacts', id, 'itemSummary'].join('/');
    return this.http.get<any>(url).toPromise();
  }

  list(): Observable<Contact[]> {
    const url = [AppService.API, 'contacts'].join('/');
    return this.http.get<Contact[]>(url);
  }

  paginate(tableState: TableState): Promise<ServerResult> {
    sessionStorage.setItem(ContactService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'contacts', 'paginate'].join('/');
    return this.http.post<any>(url, tableState).toPromise();
  }

  select(term): Observable<Contact[]> {
    const url = [AppService.API, 'contacts', term, 'select'].join('/');
    return this.http.get<Contact[]>(url);
  }

  sendVerificationCode(id): Promise<any> {
    const url = [AppService.API, 'contacts', id, 'verify'].join('/');
    return this.http.get<any>(url).toPromise();
  }

  setTax(id: number, body: any): Promise<Contact> {
    const url = [AppService.API, 'contacts', id, 'tax'].join('/');
    return this.http.put<Contact>(url, body).toPromise();
  }

  summary(id, body): Promise<any> {
    const url = [AppService.API, 'contacts', id, 'summary'].join('/');
    return this.http.post<any>(url, body).toPromise();
  }

  update(customer: Contact): Observable<Contact> {
    const url = [AppService.API, 'contacts', customer['id']].join('/');
    return this.http.put<Contact>(url, customer);
  }
}
