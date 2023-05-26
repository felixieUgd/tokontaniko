import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import * as moment from 'moment';
import server from 'smart-table-server';
import _filter from 'lodash.filter';
import _map from 'lodash.map';
import {of, SmartTable} from 'smart-table-ng';
import {FilterOperator} from 'smart-table-core';

import Invoice from 'src/app/models/invoice';
import Seat from 'src/app/models/seat';

import {AppService} from 'src/app/app.service';
import {ExportService} from 'src/app/_services/export.service';
import {InvoiceService} from './invoice.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SessionService} from 'src/app/_services/session.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (invoiceService: InvoiceService) => of(
      [],
      invoiceService.getConfig(),
      server({
        query: (tableState) => invoiceService.summary(tableState)
      })
    ),
    deps: [InvoiceService]
  }]
})
export class InvoiceComponent implements OnInit {
  drafts: Invoice[] = [];
  paidInvoices: Invoice[] = [];
  dateFormSubmitted = false;
  dateForm: FormGroup;

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              public printService: PrintService,
              public smartTableService: SmartTableService,
              private exportService: ExportService,
              private formBuilder: FormBuilder,
              private invoiceService: InvoiceService,
              private notification: NotificationService,
              private sessionService: SessionService) {
  }

  ngOnInit() {
    this.initForm();
    this.fetchDrafts({
      start: moment(this.dateForm.controls.start.value).format(),
      end: moment(this.dateForm.controls.end.value).format()
    });
  }

  displaySeat = (seats: Seat[]): string => {
    return _map(seats, 'label').join(' , ')
  };

  exportToExcel = (data, filename) => {
    const mapped = data.map(invoice => {
      return {
        id: invoice.id,
        contact_id: invoice.contact_id,
        contact_name: invoice.contact_name || invoice.Contact.name,
        reservation_id: invoice.Reservation ? invoice.Reservation.id : null,
        date_in: invoice.Reservation ? moment(invoice.Reservation.date_in).format('YYYY-MM-DD') : null,
        date_out: invoice.Reservation ? moment(invoice.Reservation.date_out).format('YYYY-MM-DD') : null,
        category_name: invoice.Category ? invoice.Category.name : null,
        subtotal: invoice.subtotal,
        balance: invoice.balance,
        invoiced_at: moment(invoice.invoiced_at).format('YYYY-MM-DD'),
        created_at: moment(invoice.created_at).format('YYYY-MM-DD HH:mm')
      };
    });

    this.exportService.exportToExcel(mapped, filename);
  };

  getSummary() {
    this.dateFormSubmitted = true;

    if (this.dateForm.valid) {
      const params = {
        start: moment(this.dateForm.controls.start.value).startOf('day').format(),
        end: moment(this.dateForm.controls.end.value).endOf('day').format()
      };

      this.fetchDrafts(params);

      this._table.filter({
        created_at: [
          {
            value: params.start,
            operator: FilterOperator.GREATER_THAN_OR_EQUAL,
            type: 'string'
          },
          {
            value: params.end,
            operator: FilterOperator.LOWER_THAN_OR_EQUAL,
            type: 'string'
          }
        ]
      });
    }
  }

  resetForm() {
    this.dateFormSubmitted = false;
    this.dateForm.reset({
      start: moment().startOf('day').toDate(),
      end: moment().endOf('day').toDate()
    });

    this.getSummary();
  }

  private fetchDrafts(dateParams?: any) {
    this.invoiceService.drafts(dateParams)
      .then(invoices => {
        this.drafts = _filter(invoices, {status: 'DRAFT'});
        this.paidInvoices = _filter(invoices, invoice => invoice.balance <= 0);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: [moment().startOf('day').toDate(), Validators.required],
      end: [moment().endOf('day').toDate(), Validators.required]
    });

    this.sessionService.setDateForm(this.dateForm, InvoiceService.TS_KEY, 'created_at');
  }
}
