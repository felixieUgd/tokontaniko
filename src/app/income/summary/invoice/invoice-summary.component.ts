import {Component, OnInit} from '@angular/core';

import {SmartTable, of} from 'smart-table-ng';
import {FilterConfiguration, FilterOperator} from 'smart-table-core';
import server from 'smart-table-server';

import * as moment from 'moment';
import _map from 'lodash.map';
import Seat from '../../../models/seat';

import {AppService} from 'src/app/app.service';
import {ExportService} from 'src/app/_services/export.service';
import {IncomeService} from '../../income.service';
import {InvoiceService} from '../../invoice/invoice.service';
import {PrintService} from 'src/app/_services/print.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';

const TS_KEY = 'TS_INVOICE_SUMMARY';

@Component({
  selector: 'app-invoice-summary',
  templateUrl: './invoice-summary-table.html',
  providers: [{
    provide: SmartTable,
    useFactory: (invoiceService: InvoiceService, incomeService: IncomeService) => of(
      [],
      invoiceService.getConfig(TS_KEY),
      server({
        query: (tableState) => invoiceService.paginate(tableState, TS_KEY)
      })
    ),
    deps: [InvoiceService]
  }]
})
export class InvoiceSummaryComponent implements OnInit {

  displayedRows = [25, 50, 100, 1000];

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              private exportService: ExportService,
              public printService: PrintService,
              public smartTableService: SmartTableService) {
  }

  ngOnInit() {
  }

  exportToExcel(data, filename) {
    const mapped = data.map(invoice => {
      const row = {
        id: invoice.id,
        contact_id: invoice.contact_id,
        contact_name: invoice.contact_name || invoice.Contact.name,
        category_name: invoice.Category ? invoice.Category.name : null,
        subtotal: invoice.amount,
        balance: invoice.balance,
        invoiced_at: moment(invoice.invoiced_at).format('YYYY-MM-DD'),
        created_at: moment(invoice.created_at).format('YYYY-MM-DD HH:mm'),
        status: invoice.status
      };

      return row;
    });

    this.exportService.exportToExcel(mapped, filename);
  }

  displaySeat = (seats: Seat[]): string => {
    return _map(seats, 'label').join(' , ')
  };

  fetchInvoices(dateParams?: any) {
    const params: FilterConfiguration = {
      created_at: [
        {
          value: dateParams.start,
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string'
        },
        {
          value: dateParams.end,
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'string'
        }
      ]
    };
    this._table.filter(params);
  }
}
