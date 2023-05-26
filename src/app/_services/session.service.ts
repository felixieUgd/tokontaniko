import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';

import {UserService} from '../settings/user/user.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private userService: UserService) {
  }

  getActiveCompany = () => {
    const user = this.getUser();
    return user ? user.activeCompany : null;
  }

  getActiveMenu = () => {
    const user = this.getUser();
    return user ? user.activeMenu[user.activeRoleIndex || 0] : null;
  }

  getCompanyId = () => {
    const company = this.getActiveCompany();
    return company ? parseInt(company.id) : null;
  }

  getCompanyMeta() {
    const company = this.getActiveCompany();
    return company ? JSON.parse(company.settings['general.company_meta']) : null;
  }

  getCompanySettings(key) {
    const company = this.getActiveCompany();
    return company ? company.settings[key] : null;
  }

  getDatesFromSession(key: string, type: string) {
    const session = sessionStorage.getItem(key);
    const tableState: any = session ? JSON.parse(session) : null;

    return tableState ? {
      start: moment(tableState.filter[type][0].value).toDate(),
      end: moment(tableState.filter[type][1].value).toDate()
    } : null;
  }

  getDefaultCurrency = () => {
    return this.getCompanySettings('general.default_currency');
  }

  getDefaultRoute = () => {
    const user = this.getUser();
    const defaultRoute = user ? user.defaultRoutes : null;
    return defaultRoute ? defaultRoute[user.activeRoleIndex || 0] : '/';
  }

  getItinerary = (form: FormGroup) => {
    const session = JSON.parse(sessionStorage.getItem('itinerary'));

    if (session) {
      form.patchValue({
        arrival_station: session.arrival_station,
        departure_station: session.departure_station,
        departure_date: session.departure_date ? new Date(session.departure_date) : null
      });
    }
  }

  getMizotraLink = () => {
    return this.getCompanySettings('general.mizotra_link');
  }

  getToken = () => {
    return sessionStorage.getItem('token');
  };

  getUserExtra = (type: 'account_id' | 'location_id') => {
    const user = this.getUser();

    if (user.hasOwnProperty('extra') && user.extra) {
      if (user.extra.hasOwnProperty(type) && user.extra[type]) {
        return user.extra[type];
      }
    }

    return null;
  };

  getUser = () => {
    const session = this.getSession();
    return session ? session.user : null;
  };

  getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem('session'));

      if (!session) {
        // throw new Error('user disconnected!');
        return {};
      }

      return session;
    }
    catch (e) {
      console.log(e);
    }

    return {};
  }

  setDateForm(form: FormGroup, key: string, attribut: string): void {
    const session = sessionStorage.getItem(key);
    const tableState = session ? JSON.parse(session) : null;

    if (tableState) {
      const formValue = form.getRawValue();
      const filter = tableState.filter.hasOwnProperty(attribut) ? tableState.filter[attribut] : [];
      let start = formValue.start ? moment(formValue.start).startOf('day').toDate() : null;
      let end = formValue.end ? moment(formValue.end).endOf('day').toDate() : null;

      filter.forEach((item, index) => {
        if (item.operator === 'gte') {
          start = moment(item.value).startOf('day').toDate();
        }
        else if (item.operator === 'lte') {
          end = moment(item.value).endOf('day').toDate();
        }
      });

      form.patchValue({
        start,
        end
      });
    }
  }

  setItinerary(itinerary: any) {
    if (Object.keys(itinerary).length) {
      sessionStorage.setItem('itinerary', JSON.stringify({
        arrival_station: itinerary.arrival_station || null,
        departure_station: itinerary.departure_station || null,
        departure_date: itinerary.departure_date || null
      }));
    }
  }

  setOnboarded() {
    const session = this.getSession();
    const user = this.getUser();

    session.user.extra = Object.assign(user.extra || {}, {onboarded: true});

    sessionStorage.setItem('session', JSON.stringify(session));

    return this.userService.updateProfile(user.id,
      {
        Profile: {custom_fields: session.user.extra}
      });
  }

  switchRole(index: number) {
    const session = this.getSession();
    const user = this.getUser();

    session.user.activeRoleIndex = index;

    sessionStorage.setItem('session', JSON.stringify(session));
  }
}
