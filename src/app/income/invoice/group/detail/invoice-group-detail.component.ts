import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

import {FilterOperator} from 'smart-table-core';
import _forEach from 'lodash.foreach';
import _orderBy from 'lodash.orderby';
import _sumBy from 'lodash.sumby';
import _uniqBy from 'lodash.uniqby';
import * as moment from 'moment';

import Account from 'src/app/models/account';
import Invoice from 'src/app/models/invoice';
import InvoiceGroup from 'src/app/models/invoice-group';

import {AccountService} from 'src/app/accounting/account/account.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {TranslateService} from '@ngx-translate/core';
import {UtilityService} from 'src/app/_services/utility.service';

@Component({
  selector: 'app-invoice-group-detail',
  templateUrl: './invoice-group-detail.component.html',
  styleUrls: ['../../../../../assets/scss/plugins/_datepicker.scss']
})
export class InvoiceGroupDetailComponent implements OnInit {
  accounts: Account[];
  contactInput$ = new Subject<string>();
  invoiceGroup: InvoiceGroup;
  scanForm: FormGroup;
  searchForm: FormGroup;
  selectedAccount: Account;

  invoices: any[];
  invoiceToDelete: number;
  loading: boolean;
  Total:any = {
    balance: 0,
    discount: 0,
    payment: 0,
    payment_due: 0,
    tax: 0
  };

  contact;
  departure_date;
  submitted;
  submitted_scan;
  subscriptions = [];

  constructor(
    public utilityService: UtilityService,
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private invoiceService: InvoiceService,
    private notification: NotificationService,
    private printService: PrintService,
    private translate: TranslateService
  ) {}

  ngOnDestroy() {
    if (this.subscriptions.length > 0) {
      _forEach(this.subscriptions, (sub) => sub.unsubscribe());
    }
  }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.invoiceGroup = new InvoiceGroup({});

    this.initForm();
    this.getInvoiceGroup(id);
    this.getAccounts();
  }

  addInvoice(invoice, index?) {
    if (this.isValid(invoice)) {
      this.invoiceGroup.Invoices.push(invoice);
      this.invoiceGroup['InvoiceItems'].push(invoice)

      if (typeof index !== 'undefined') {
        this.invoices.splice(index, 1);
      }
    }
  }

  calculSummary() {
    this.Total.payment = this.getTotalPayment(this.invoiceGroup);
    this.Total.payment_due = this.getPaymentDue(this.invoiceGroup);
    this.Total.discount = _sumBy(this.invoiceGroup.Invoices, 'discount');
    this.Total.tax = _sumBy(this.invoiceGroup.Invoices, 'tax');
    this.Total.balance = this.Total.payment_due + this.Total.tax - this.Total.discount - this.Total.payment;
    this.invoiceGroup['Total'] = this.Total;
  }

  dropInvoice(id) {
    this.invoiceService.drop(this.invoiceGroup.id, id)
      .then(res => {
        this.refresh();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  onSelectContact(event) {
    if (event) {
      this.invoiceGroup.contact_id = event.id;
      this.invoiceGroup.contact_name = event.name;
    }
  }

  print(isFlatten?) {
    this.invoiceService.invoiceGroupPrint(this.invoiceGroup.id)
      .then(res => this.printService.invoiceGroup(this.invoiceGroup, isFlatten))
      .catch(err => this.notification.error(null, err.error));
  }

  submitScan() {
    const id = this.scanForm.get('invoice_id').value;
    this.submitted_scan = true;

    if (id) {
      this.invoiceService.scanManifest(id)
        .then(res => {
          this.submitted_scan = false;
          this.scanForm.reset();

          this.addInvoice(res);
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'INPUT_NOT_VALID');
    }
  }

  submitSearch() {
    this.invoices = [];
    this.submitted = true;

    if (this.searchForm.valid) {
      const formValue = this.searchForm.getRawValue();
      const tableState = Object.assign({}, this.invoiceService.getConfig(), {
        search: {
          escape: false,
          flags: 'i',
          scope: ['contact_name'],
          value: formValue.contact ? formValue.contact.name : ''
        },
        filter: {
          due_at: [
            {
              value: moment(formValue.start).startOf('day').format(),
              operator: FilterOperator.GREATER_THAN_OR_EQUAL,
              type: 'string'
            },
            {
              value: moment(formValue.end).endOf('day').format(),
              operator: FilterOperator.LOWER_THAN_OR_EQUAL,
              type: 'string'
            }
          ]
        }
      });

      this.invoiceService.summary(tableState)
        .then(res => {
          this.invoices = res.data.filter((item:any) => !/.*CANCELED|VOIDED*./.test(item.status))
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateGroup(isSent?: boolean) {
    if (this.invoiceGroup.Invoices.length > 0) {
      const contact:any = this.invoiceGroup.Invoices.length ? this.invoiceGroup.Invoices[0].Contact.name : null;
      const body = {
        contact_id: contact ? contact.id : null,
        contact_name: contact ? contact.name : null,
        invoiced_at: this.invoiceGroup.invoiced_at,
        due_at: this.invoiceGroup.due_at,
        meta: isSent ? Object.assign({}, this.invoiceGroup.meta, {is_sent: isSent}) : this.invoiceGroup.meta,
        Invoices: this.invoiceGroup.Invoices
      };

      this.invoiceService.updateGroup(this.invoiceGroup.id, body)
        .then(res => {
          this.notification.success(null, 'UPDATE_SUCCESS');
          this.refresh();
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'INVOICE_NOT_FOUND');
    }
  }

  private flatten(invoices: Invoice[]): Invoice[] {
    const response: Invoice[] = [];

    invoices.forEach(invoice => {
      invoice['discount'] = this.invoiceService.getTotalDiscount(invoice.InvoiceItems);
      invoice['tax'] = this.invoiceService.getTotalTax(invoice.InvoiceItems);

      this.subscriptions.push(
        this.translate.get('status.' + invoice.status).subscribe((text: string) => {
          invoice['str_status'] = text;
        })
      );

      invoice.InvoiceItems.forEach(item => {
        response.push(
          Object.assign(
            {},
            invoice,
            {
              amount: item.quantity * item.price,
              description: item.name,
              quantity: item.quantity
            }
          )
        );
      });
    });

    return response;
  }

  private getAccounts() {
    this.accountService.list({type: 'all'})
      .toPromise()
      .then(accounts => this.accounts = accounts)
      .catch(err => this.notification.error(this, err.error));
  }

  private getInvoiceGroup(id) {
    this.invoiceService.getGroup(id)
      .then(res => {
        this.searchForm.patchValue({
          contact: res.Contact
        });

        this.invoiceGroup = res;
        this.invoiceGroup['InvoiceItems'] = this.flatten(res.Invoices);

        this.calculSummary();
      })
      .catch(err => {
        // console.log(err)
        this.notification.error(null, err.error)
      });
  }

  private getPaymentDue(invoiceGroup) {
    let total = 0;

    invoiceGroup.Invoices.forEach(
      (invoice: Invoice) => total += this.invoiceService.getPaymentDue(invoice.InvoiceItems)
    );

    return total;
  }

  private getTotalPayment(invoiceGroup) {
    let total = 0;

    invoiceGroup.Invoices.forEach(
      (invoice: Invoice) => total += _sumBy(invoice.Revenues, 'amount')
    );

    return total;
  }

  private initForm() {
    this.searchForm = this.formBuilder.group({
      contact: [null, Validators.required],
      end: moment().endOf('day').toDate(),
      start: moment().startOf('month').toDate()
    });

    this.scanForm = this.formBuilder.group({
      invoice_id: [null, Validators.required]
    });
  }

  private isValid(invoice: Invoice) {
    if (invoice.status === 'VOIDED') {
      this.notification.error(null, 'INVOICE_VOIDED');
      return false;
    }

    if (invoice.invoice_group_id) {
      this.notification.error(null, 'INVOICE_NOT_VALID');
      return false;
    }

    return true;
  }

  private refresh() {
    this.invoices = null;
    this.invoiceToDelete = null;
    this.submitted_scan = false;
    this.submitted = false;
    this.Total = {
      balance: 0,
      discount: 0,
      payment: 0,
      payment_due: 0,
      tax: 0
    };
    this.scanForm.reset();
    this.searchForm.reset({
      end: moment().endOf('day').toDate(),
      start: moment().startOf('month').toDate()
    });

    this.getInvoiceGroup(this.invoiceGroup.id);
  }
}
