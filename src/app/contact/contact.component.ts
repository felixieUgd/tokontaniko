import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

import {FilterOperator} from 'smart-table-core';
import {SmartTable, of} from 'smart-table-ng';
import server from 'smart-table-server';
import * as moment from 'moment';
import _orderBy from 'lodash.orderby';
import Contact from '../models/contact';

import {AppService} from '../app.service';
import {ContactService} from './contact.service';
import {ExportService} from '../_services/export.service';
import {SharedService} from '../_services/shared.service';
import {SmartTableService} from '../_services/smart-table.service';
import {SessionService} from '../_services/session.service';
import Reward from '../models/reward';
import {NotificationService} from '../_services/notification.service';
import {InvoiceService} from '../income/invoice/invoice.service';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: [],
  providers: [{
    provide: SmartTable,
    useFactory: (contactService: ContactService) => of(
      [],
      contactService.getConfig(),
      server({
        query: (tableState) => contactService.paginate(tableState)
      })
    ),
    deps: [ContactService]
  }]
})
export class ContactListComponent implements OnInit, OnDestroy {

  dateForm: FormGroup;
  discounts: Contact[];
  rewards: Reward[];

  submitted: boolean;

  subscription: Subscription;

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    public contactService: ContactService,
    public invoiceService: InvoiceService,
    private exportService: ExportService,
    private router: Router,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private sessionService: SessionService,
    private sharedService: SharedService,
    public smartTableService: SmartTableService
  ) {}

  ngOnInit() {
    this.getRewarded();
    this.getRewards();
    this.initForm();

    this.subscription = this.sharedService.contact$.subscribe((contact: Contact) => {
      if (contact) {
        this.router.navigate(['/contact/detail', contact.id]);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  completionRate(item) {
    let point = 0;
    let coeff = 4;

    // if (item.name && item.name !== '') { point++; }
    if (item.id_cin && item.id_cin !== '') { point++; }
    if (item.id_passport && item.id_passport !== '') { point++; }
    if (item.phone && item.phone !== '') { point++; }
    if (item.email && item.email !== '') { point++; }

    return Math.round(point * 100 / coeff);
  }

  export(table) {
    const data = [];

    table.forEach(item => {
      data.push({
        // Taux_completion: this.completionRate(item),
        ID: item.id,
        Nom: item.name,
        Tel: item.phone,
        Email: item.email,
        CIN: item.id_cin,
        Passeport: item.id_passport,
        Nbr_reservation: item.Reservations.length,
        Statut: this.getCustomerReward(item).code,
        Creation: moment(item.created_at).format('YYYY-MM-DD HH:mm')
      });
    });

    this.exportService.exportToExcel(data, 'Contact_report');
  }

  filterData() {
    this.submitted = true;

    if (this.dateForm.valid) {
      let createdAtFilter = [];

      const formValue = this.dateForm.getRawValue();

      if (formValue.start) {
        createdAtFilter.push({
          value: moment(formValue.start).startOf('day').format(),
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      if (formValue.end) {
        createdAtFilter.push({
          value: moment(formValue.end).endOf('day').format(),
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      this._table.filter({
        created_at: (createdAtFilter.length) ? createdAtFilter : undefined
      });
    }
  }

  getCustomerReward(customer: Contact): any {
    return this.contactService.getCustomerReward(this.rewards, customer);
  }

  open() {
    this.sharedService.newContact(null);
    this.sharedService.updateSidePanel(true);
  }

  resetForm() {
    this.submitted = false;
    this.dateForm.reset({
      end: null,
      start: null
    });

    this.filterData();
  }

  private getRewarded() {
    this.contactService.getRewarded('', 'rewarded')
      .then(res => {
        this.discounts = res;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getRewards() {
    this.contactService.getRewards()
      .toPromise()
      .then(res => {
        this.rewards = _orderBy(res, ['points_threshold'], ['desc']);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: null,
      end: null
    });

    this.sessionService.setDateForm(this.dateForm, ContactService.TS_KEY, 'created_at');
  }

}
