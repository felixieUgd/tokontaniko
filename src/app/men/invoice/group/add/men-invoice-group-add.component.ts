import { Component, OnInit, ViewChild } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Observable, Subject, concat, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap, catchError} from 'rxjs/operators';
import {AppService} from 'src/app/app.service';
import {ContactService} from 'src/app/contact/contact.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import Contact from 'src/app/models/contact';
import Invoice from 'src/app/models/invoice';
import {NotificationService} from 'src/app/_services/notification.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {FilterOperator} from 'smart-table-filter';
import * as moment from 'moment';
import _sumBy from 'lodash.sumby';
import {MenService} from 'src/app/men/men.service';
import Facility from 'src/app/models/facility';
import {SmartTable, of as ofST, StTableDirective} from 'smart-table-ng';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import server from 'smart-table-server';

const KEY = 'TS_MEN_INVOICE_SUMMARY';

@Component({
  selector: 'app-men-invoice-group-add',
  templateUrl: './men-invoice-group-add.component.html',
  styleUrls: ['./men-invoice-group-add.component.css'],
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
export class MenInvoiceGroupAddComponent implements OnInit {

  contact$: Observable<Contact[]>;
  contactInput$ = new Subject<string>();
  invoiceForm: FormGroup;
  invoiceGroups: Invoice[] = [];
  searchKeyword: string = '';
  scanForm: FormGroup;
  searchForm: FormGroup;

  arrival_station;
  minDate;
  seats_number = 0;
  submitted;
  submitted_scan;
  submitted_search;
  subtotal = 0;

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
    public utilityService: UtilityService,
    public smartTableService: SmartTableService,
    public appService: AppService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private invoiceService: InvoiceService,
    private notification: NotificationService,
    private menService: MenService,
    private router: Router
  ) { }

  ngOnInit() {
    this.minDate = this.appService.getCurrentDate();
    this.initForm();
  }

  addInvoice(invoice, index?) {
    if (this.isValid(invoice)) {
      const find = this.invoiceGroups.find(group => {
        return group.id === invoice.id;
      });

      if (!find) {
        this.invoiceService.scanManifest(invoice.id)
          .then(res => {
            this.invoiceGroups.push(res);

            if (typeof index !== 'undefined' && this.smartTableDirective) {
              this.smartTableDirective.items.splice(index, 1);
            }

            this.calculSummary();
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        this.notification.error(null, 'INVOICE_ALREADY_SELECTED');
      }
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
          due_at: moment().format(),
          meta: {
            account_id: formValue.account_id,
            school_year: formValue.school_year,
            total: this.subtotal
          },
          Invoices: this.invoiceGroups
        };

        this.invoiceService.createGroup(body)
          .then(res => {
            this.router.navigate(['/men/invoice/group/detail/', res.id]);
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

  submitSearch() {
    this.submitted_search = true;

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
      start: moment().startOf('month').toDate(),
      end: moment().endOf('day').toDate(),
      facility: null
    });

    this.invoiceForm = this.formBuilder.group({
      due_at: null,
      contact: [null, Validators.required],
      invoiced_at: null,
      school_year: [null, Validators.required]
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
