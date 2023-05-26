import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import Bill, {BillItem} from '../models/bill';
import Invoice, {InvoiceItem} from '../models/invoice';
import InvoicePayment from '../models/invoice-payment';
import Revenue from '../models/revenue';
import BillPayment from '../models/bill-payment';

import _filter from 'lodash.filter';
import _forEach from 'lodash.foreach';
import _sumBy from 'lodash.sumby';

import {AppService} from '../app.service';
import {FormGroup} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import InvoiceGroup from '../models/invoice-group';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private $invoice = new Subject<Invoice | Bill>();
  private $payment = new Subject<Revenue | InvoicePayment>();
  private $sidePanelPayment = new Subject<boolean>();

  constructor(
    private translate: TranslateService
  ) { }

  get facture() {
    return this.$invoice;
  }

  get payment() {
    return this.$payment;
  }

  get sidePanelPayment() {
    return this.$sidePanelPayment;
  }

  getInvoiceCount(invoiceGroup: InvoiceGroup) {
    return _sumBy(invoiceGroup.Invoices, item => item.InvoiceItems.length);
  }

  getItemTotal = (formGroup: FormGroup) => {
    const total = formGroup.controls.quantity.value * formGroup.controls.price.value;

    formGroup.patchValue({total: total});

    return total;
  }

  getPaymentDue(items: InvoiceItem[] | BillItem[], item_type?: 'SERVICES'): number {
    return _sumBy(items, item => {
      if (item_type) {
        return (item_type === item.item_type) ? (item.quantity * item.price) : 0;
      }
      else return item.quantity * item.price;
    });
  }

  getPaymentDueGroup(invoiceGroup: InvoiceGroup) {
    let total = 0;

    invoiceGroup.Invoices.forEach(
      (invoice: Invoice) => total += this.getPaymentDue(invoice.InvoiceItems)
    );

    return total;
  }

  getPaymentInfo(Revenues: Revenue[]) {
    let type = [];
    let amount = 0;

    if (Revenues && Revenues.length > 0) {
      Revenues.forEach(item => {
        this.translate.get('payment.' + item.payment_method)
          .subscribe(value => {
            if (!item.reconciled) {
              type.push(value);
            }

            amount += item.amount;
          });
      });
    }

    return {
      type: type.join('/'),
      amount: amount
    };
  }

  getAmountByPaymentMethod(revenues: Revenue[]): any {
    const Amount = {
      Cash: 0,
      CreditCard: 0,
      MobileMoney: 0,
      WireTransfer: 0
    };

    revenues.forEach(item => {
      Amount['Global'] += item.amount;

      switch(item.payment_method) {
        case 'MVOLA':
        case 'ORANGE_MONEY':
        case 'AIRTEL_MONEY':
          Amount['MobileMoney'] += item.amount;
          break;
        case 'CREDIT_CARD':
          Amount['CreditCard'] += item.amount;
          break;
        case 'SP':
          Amount['SP'] += item.amount;
          break;
        case 'WIRE_TRANSFER':
          Amount['WireTransfer'] += item.amount;
          break;
        default:
          Amount['Cash'] += item.amount;
          break;
      }
    });

    return Amount;
  }

  getTotalDiscount(items: any[]): number {
    let amount = 0;

    _forEach(items, (item) => {
      amount += _sumBy(item.Taxes, (tax) => {
        if (tax.type === 'DISCOUNT') {
          return (item.price * item.quantity) * tax.rate / 100;
        } else {
          return 0;
        }
      });
    });

    return amount;
  }

  /*
    SP not taken into account
  */
  getTotalPayment(payments: Revenue[] | BillPayment[]): number {
    return _sumBy(payments, (revenu) => {
      if (revenu.payment_method === 'SP') return 0;
      else if (revenu.currency_code === AppService.DEFAULT_CURRENCY) return revenu.amount;
      else return revenu.amount / (revenu.currency_rate || 1);
    });
  }

  getTotalTax(items: any[]): number {
    return _sumBy(items, item => {
      return _sumBy(item.Taxes, (tax) => {
        if (tax.type === 'FIXED') {
          return item.quantity * tax.rate;
        }
        else if (tax.type !== 'DISCOUNT' && tax.type !== 'OTHER') {
          return (item.price * item.quantity) * tax.rate / 100;
        }
        else {
          return 0;
        }
      });
    });
  }

  getTotalPaymentCurrency(object: Invoice | Bill) {
    const payments = object instanceof Invoice ? object['Revenues'] : object['Payments'];

    return _sumBy(payments, (revenu) => {
      return (revenu.currency_code !== AppService.DEFAULT_CURRENCY) ? revenu.amount : 0;
    });
  }

  getTotalPaymentExtra(object: Invoice | Bill) {
    const items = object instanceof Invoice ? object['InvoiceItems'] : object['BillItems'];
    const payments = object instanceof Invoice ? object['Revenues'] : object['Payments'];

    if (items.length > 0) {
      return _sumBy(payments, (revenu) => {
        return (revenu.currency_code === AppService.DEFAULT_CURRENCY && revenu.amount > 0) ? revenu.amount : 0;
      });
    }

    return 0;
  }

  getTotalPaymentGroup(invoiceGroup: InvoiceGroup) {
    let total = 0;

    invoiceGroup.Invoices.forEach(
      (invoice: Invoice) => total += this.getTotalPayment(invoice.Revenues)
    );

    return total;
  }
}
