import { Component, OnInit, ViewChild } from '@angular/core';
import _sumBy from 'lodash.sumby';
import _forEach from 'lodash.foreach';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import * as moment from 'moment';
import {Observable, Subject} from 'rxjs';
import {AccountService} from 'src/app/accounting/account/account.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import Account from 'src/app/models/account';
import Invoice from 'src/app/models/invoice';
import InvoiceGroup from 'src/app/models/invoice-group';
import {NotificationService} from 'src/app/_services/notification.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {FilterOperator} from 'smart-table-filter';
import {MenService} from 'src/app/men/men.service';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {SmartTable, StTableDirective, of as ofST} from 'smart-table-ng';
import Facility from 'src/app/models/facility';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {AppService} from 'src/app/app.service';
import server from 'smart-table-server';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';

const KEY = 'TS_MEN_INVOICE_SUMMARY_DETAIL';
@Component({
  selector: 'app-men-invoice-group-detail',
  templateUrl: './men-invoice-group-detail.component.html',
  styleUrls: ['./men-invoice-group-detail.component.css'],
  providers: [
    {
      provide: SmartTable,
      useFactory: (invoiceService: InvoiceService, menService: MenService) => ofST(
        [],
        menService.getInvoiceSummaryConfig(KEY),
        server({
          query: (tableState) => invoiceService.summary(tableState, KEY)
        })
      ),
      deps: [
        InvoiceService,
        MenService
      ]
    }
  ]
})
export class MenInvoiceGroupDetailComponent implements OnInit {

  accounts: Account[];
  contactInput$ = new Subject<string>();
  invoiceGroup: InvoiceGroup;
  searchForm: FormGroup;
  selectedAccount: Account;

  searchKeyword: string;
  invoiceToDelete: number;
  loading: boolean;
  Total: any = {
    balance: 0,
    discount: 0,
    payment: 0,
    payment_due: 0,
    tax: 0
  };

  contact;
  departure_date;
  submitted;
  subscriptions = [];

  @ViewChild(StTableDirective) smartTableDirective: StTableDirective<any>;

  formatter = (item: Facility) => {
    return item.name;
  }

  searchFacility = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => term.length <= 3 ? [] :
        this.menService.select(term)
          .toPromise()
          .then(res => {
            return res.length > 0 ? res : [null];
          })
          .catch(err => {
            this.notification.error(null, err.error);
          }))
    );

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    public smartTableService: SmartTableService,
    public utilityService: UtilityService,
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private invoiceService: InvoiceService,
    private notification: NotificationService,
    private menService: MenService,
    private translate: TranslateService
  ) { }

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
      const find = this.invoiceGroup.Invoices.find(group => {
        return group.id === invoice.id;
      });

      if (!find) {
        this.invoiceGroup.Invoices.push(invoice);
        this.invoiceGroup['InvoiceItems'].push(invoice)
  
        if (typeof index !== 'undefined' && this.smartTableDirective) {
          this.smartTableDirective.items.splice(index, 1);
        }
      }
      else {
        this.notification.error(null, 'INVOICE_ALREADY_SELECTED');
      }
    }
  }

  calculSummary() {
    this.Total.payment = this.getTotalPayment(this.invoiceGroup);
    this.Total.payment_due = this.getPaymentDue(this.invoiceGroup);
    this.Total.balance = this.Total.payment_due - this.Total.payment;
    this.invoiceGroup['Total'] = this.Total;
  }

  @Confirmable({title: 'Retirer la facture'})
  dropInvoice(id: number, index: number) {
    const invoiceItems = this.invoiceGroup['InvoiceItems'];
    if (invoiceItems[index] && invoiceItems[index].quantity) {
      this.invoiceService.drop(this.invoiceGroup.id, id)
        .then(res => {
          this.refresh();
          this.notification.success(null, 'DELETE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      invoiceItems.splice(index, 1);
    }
  }

  onSelectContact(event) {
    if (event) {
      this.invoiceGroup.contact_id = event.id;
      this.invoiceGroup.contact_name = event.name;
    }
  }

  submitSearch() {
    this.submitted = true;

    if (this.searchForm.valid) {
      const formValue = this.searchForm.getRawValue();
      this._table.filter({
        invoiced_at: [
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
      });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateGroup(isSent?: boolean) {
    if (this.invoiceGroup.Invoices.length > 0) {
      const contact: any = this.invoiceGroup.Invoices.length && this.invoiceGroup.Invoices[0].Contact ? this.invoiceGroup.Invoices[0].Contact.name : null;
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
      facility: null,
      end: moment().endOf('day').toDate(),
      start: moment().startOf('month').toDate()
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
    this.invoiceToDelete = null;
    this.submitted = false;
    this.Total = {
      balance: 0,
      payment: 0,
      payment_due: 0
    };
    this.searchForm.reset({
      end: moment().endOf('day').toDate(),
      start: moment().startOf('month').toDate()
    });

    this.getInvoiceGroup(this.invoiceGroup.id);
  }

}
