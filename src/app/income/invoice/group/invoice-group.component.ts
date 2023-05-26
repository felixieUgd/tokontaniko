import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import _sumBy from 'lodash.sumby';
import _forEach from 'lodash.foreach';
import * as moment from 'moment';
import server from 'smart-table-server';
import {FilterOperator} from 'smart-table-core';
import {SmartTable, of} from 'smart-table-ng';

import Account from 'src/app/models/account';
import InvoiceGroup from 'src/app/models/invoice-group';

import {AccountService} from 'src/app/accounting/account/account.service';
import {AppService} from 'src/app/app.service';
import {ExportService} from 'src/app/_services/export.service';
import {InvoiceService} from '../invoice.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {SessionService} from 'src/app/_services/session.service';
import {UtilityService} from 'src/app/_services/utility.service';

const TS_KEY = 'TS_INVOICE_GROUP';

@Component({
  selector: 'app-invoice-group',
  templateUrl: './invoice-group.component.html',
  styleUrls: ['../../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (invoiceService: InvoiceService) => of(
      [],
      invoiceService.getConfig(TS_KEY),
      server({
        query: (tableState) => invoiceService.paginateGroup(tableState, TS_KEY)
      })
    ),
    deps: [InvoiceService]
  }]
})
export class InvoiceGroupComponent implements OnInit {
  dateForm: FormGroup;

  dateFormSubmitted = false;

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              private exportService: ExportService,
              private accountService: AccountService,
              private invoiceService: InvoiceService,
              private formBuilder: FormBuilder,
              private notification: NotificationService,
              private sessionService: SessionService,
              public smartTableService: SmartTableService,
              private utilityService: UtilityService) {
  }

  ngOnInit() {
    this.initForm();
  }

  export(table: InvoiceGroup[]) {
    const data = [];

    table.forEach(group => {
      const invoice_size = group.Invoices.length;
      const montant = invoice_size > 0 ? group.meta.total : 0;

      data.push({
        numero: group.id,
        cooperative: group.Contact.name,
        date: moment(group.due_at).format('DD/MM/YYYY'),
        nombre: group.Invoices.length,
        montant: montant,
        creation: moment(group.created_at).format('DD/MM/YYYY')
      });
    });

    this.exportService.exportToExcel(data, 'Manifest_report');
  }

  filterResult() {
    this.dateFormSubmitted = true;

    if (this.dateForm.valid) {
      const params = {
        start: moment(this.dateForm.controls.start.value).startOf('day').format(),
        end: moment(this.dateForm.controls.end.value).endOf('day').format()
      };

      this._table.slice(this.invoiceService.getConfig().slice);
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

  getInvoiceGroupAmount(invoiceGroup: InvoiceGroup) {
    let amount = 0;

    invoiceGroup.Invoices.forEach(invoice => {
      amount += this.invoiceService.getPaymentDue(invoice.InvoiceItems);
    });

    return amount;
  }

  resetForm() {
    this.dateFormSubmitted = false;
    this.dateForm.reset({
      start: moment().startOf('year').toDate(),
      end: moment().endOf('day').toDate()
    });

    this.filterResult();
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: [moment().startOf('year').toDate(), Validators.required],
      end: [moment().endOf('day').toDate(), Validators.required]
    });

    this.sessionService.setDateForm(this.dateForm, TS_KEY, 'created_at');
  }
}
