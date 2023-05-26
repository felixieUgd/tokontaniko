import {Injectable} from '@angular/core';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';

import {PaymentMethod} from './models/payment-method';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public static get APP_ID() {
    const API = AppService.API;
    if (!API) {
      return null;
    }

    const split = API.split('/');
    return split[split.length - 1];
  };

  public static get API() {
    return localStorage.getItem('API');
  }

  public static set API(value: string) {
    localStorage.setItem('API', value);
  };

  public static CHANNELS = ['STORE', 'PHONE', 'EMAIL', 'OTHER'];
  public static DEFAULT_CURRENCY = 'MGA';
  public static DEFAULT_IMAGE = 'assets/images/p0.jpg';
  public static DEFAULT_LOGO = 'assets/images/logo/logo_tokotaniko.png';
  public static EVENT_TYPES = ['OFFENSE', 'NOTE', 'CONTRIBUTION'];
  public static ITEM_TYPES = ['ASSET', 'GOODS', 'SERVICES'];

  private current_date = new Date();

  displayedRows = [25, 50, 100];

  constructor() {
  }

  category_types = ['expense', 'income', 'insurance', 'item', 'maintenance', 'claim', 'other'];

  currencyConfig: any = {
    labelField: 'name',
    valueField: 'code',
    searchField: ['name']
  };

  marital_statuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOW', 'UNK'];

  paymentMethods: PaymentMethod[] = _orderBy([
    {
      code: 'CASH',
      name: 'Espèce',
      order: 1,
      description: 'Cash'
    },
    {
      code: 'CHECK',
      name: 'Chèque',
      order: 2,
      description: 'Check'
    },
    {
      code: 'CREDIT_CARD',
      name: 'Carte crédit',
      order: 4,
      description: 'Credit card'
    },
    {
      code: 'WIRE_TRANSFER',
      name: 'Virement bancaire',
      order: 5,
      description: 'Wire transfer'
    },
    {
      code: 'MVOLA',
      name: 'MVola',
      order: 6,
      description: 'MVola'
    },
    {
      code: 'ORANGE_MONEY',
      name: 'Orange money',
      order: 7,
      description: 'Orange money'
    },
    {
      code: 'AIRTEL_MONEY',
      name: 'Airtel money',
      order: 8,
      description: 'Airtel money'
    },
    {
      code: 'MONEY_ORDER',
      name: 'Western Union',
      order: 9,
      description: 'Western Union'
    },
    {
      code: 'BNI_PAY',
      name: 'BNI P@Y',
      order: 10,
      description: 'BniPay'
    },
    {
      code: 'SP',
      name: 'SP',
      order: 11,
      description: 'Spécial / Service Patron'
    },
    {
      code: 'REWARD',
      name: 'Récompense',
      order: 12,
      description: 'Récompense fidélité'
    }
  ], ['name'], ['asc']);

  selectConfig: any = {
    labelField: 'name',
    valueField: 'id',
    searchField: ['name']
  };

  statuses = [
    'DRAFT', 'SENT', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'PENDING',
    'PAID', 'PARTIAL', 'CANCELED', 'RECEIVED', 'REFUNDED', 'VOIDED'
  ];
  request_statuses = ['DRAFT', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

  taxTypes = ['NORMAL', 'INCLUSIVE', 'COMPOUND', 'FIXED', 'DISCOUNT', 'OTHER'];

  displayName(name) {
    const splitted = name ? name.toString().split(' ') : [];
    return splitted.length > 1 ? splitted[0] + ' ' + splitted[1].substr(0, 1) : name;
  }

  getBillCode = () => {
    return 'BILL-' + moment().valueOf();
  }

  getInvoiceCode = () => {
    return 'INV-' + moment().valueOf();
  }

  getMinDate = () => {
    return {year: 1900, month: 1, day: 1};
  }

  getCurrentDate = () => {
    const today = new Date();

    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  };

  getMaxDate() {
    return {
      year: this.current_date.getFullYear(),
      month: this.current_date.getMonth() + 1,
      day: this.current_date.getDate()
    };
  }

  getDateEndOf(type: moment.unitOfTime.StartOf, str_date?: string): moment.Moment {
    const momentDate = str_date ? moment(str_date) : moment();
    return momentDate.isValid() ? momentDate.endOf(type) : null;
  }

  getDateStartOf(type: moment.unitOfTime.StartOf, str_date?: string): moment.Moment {
    const momentDate = str_date ? moment(str_date) : moment();
    return momentDate.isValid() ? momentDate.startOf(type) : null;
  }

  getYears() {
    const years = [];

    for (let i = 2000; i < moment().year(); i++) {
      years.push(i);
    }

    return years.sort();
  }
}
