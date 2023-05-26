import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Observable, Subject, concat} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';

import {of} from 'smart-table-ng';
import {FilterOperator} from 'smart-table-core';
import _groupBy from 'lodash.groupby';
import _orderBy from 'lodash.orderby';
import _sumBy from 'lodash.sumby';
import * as moment from 'moment';

import Invoice from 'src/app/models/invoice';
import Contact from 'src/app/models/contact';

import {AppService} from 'src/app/app.service';
import {ContactService} from 'src/app/contact/contact.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {UtilityService} from 'src/app/_services/utility.service';

@Component({
  selector: 'app-invoice-group-add',
  templateUrl: './invoice-group-add.component.html',
  styleUrls: ['../../../../../assets/scss/plugins/_datepicker.scss']
})
export class InvoiceGroupAddComponent implements OnInit {

  contact$: Observable<Contact[]>;
  contactInput$ = new Subject<string>();
  invoiceForm: FormGroup;
  invoiceGroups: Invoice[] = [];
  invoices: any[];
  scanForm: FormGroup;
  searchForm: FormGroup;

  arrival_station;
  minDate;
  seats_number = 0;
  submitted;
  submitted_scan;
  submitted_search;
  subtotal = 0;

  constructor(
    public utilityService: UtilityService,
    private appService: AppService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private invoiceService: InvoiceService,
    private notification: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.minDate = this.appService.getCurrentDate();
    this.initForm();
  }

  addInvoice(invoice, index?) {
    if (this.isValid(invoice)) {
      this.invoiceService.scanManifest(invoice.id)
        .then(res => {
          this.invoiceGroups.push(res);

          if (typeof index !== 'undefined') {
            this.invoices.splice(index, 1);
          }

          this.calculSummary();
        })
        .catch(err => this.notification.error(null, err.error));
    }
  }

  calculSummary() {
    this.subtotal = _sumBy(this.invoiceGroups, 'amount');
  }

  dropInvoice(index) {
    this.invoiceGroups.splice(index, 1);
    this.calculSummary();
  }

  onSelectContact(event) {
    this.invoiceForm.patchValue({
      contact: event
    });
  }

  save() {
    this.submitted = true;

    if (this.invoiceForm.valid && this.invoiceGroups.length > 0) {
      if (this.invoiceGroups.length > 0) {
        const formValue = this.invoiceForm.getRawValue();
        const body = {
          contact_id: formValue.contact ? formValue.contact.id : null,
          contact_name: formValue.contact ? formValue.contact.name : null,
          invoiced_at: moment().format(),
          due_at: moment(formValue.due_at).format(),
          meta: {
            account_id: formValue.account_id,
            total: this.subtotal
          },
          Invoices: this.invoiceGroups
        };

        this.invoiceService.createGroup(body)
          .then(res => {
            this.router.navigate(['/income/group/detail/', res.id]);
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        this.notification.error(null, 'INVOICE_NOT_VALID');
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  submittedScan() {
    this.submitted = true;
    this.submitted_scan = true;

    if (this.invoiceForm.valid && this.scanForm.valid) {
      const formValue = this.scanForm.getRawValue();

      this.invoiceService.scanManifest(formValue.invoice_id)
        .then(res => {
          this.submitted_scan = false;
          this.scanForm.reset();
          this.invoiceGroups.push(res);

          this.calculSummary();
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  submitSearch() {
    this.submitted_search = true;

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
          this.invoices = res.data.filter(item => !/.*CANCELED|VOIDED*./.test(item['status']));
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.contact$ = concat(
      of([]),
      this.contactInput$.pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(term => !term || term.length < 3 ? [] : this.contactService.select(term).pipe(
          catchError(() => of([]))
        ))
      )
    );

    this.searchForm = this.formBuilder.group({
      contact: [null, Validators.required],
      start: moment().startOf('month').toDate(),
      end: moment().endOf('day').toDate()
    });

    this.invoiceForm = this.formBuilder.group({
      account_id: null,
      contact: [null, Validators.required],
      due_at: [null, Validators.required],
      invoiced_at: null,
      invoice_group_number: null
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
}
