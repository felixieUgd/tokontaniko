import {Component, OnInit} from '@angular/core';

import {SmartTable, of} from 'smart-table-ng';
import {FilterConfiguration, FilterOperator} from 'smart-table-core';
import server from 'smart-table-server';

import {BillService} from '../../bill/bill.service';
import {AppService} from 'src/app/app.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';

const TS_KEY = 'TS_BILL_SUMMARY';

@Component({
  selector: 'app-bill-summary',
  templateUrl: './bill-summary-table.html',
  providers: [{
    provide: SmartTable,
    useFactory: (billService: BillService) => of(
      [],
      billService.getConfig(TS_KEY),
      server({
        query: (tableState) => billService.paginate(tableState, TS_KEY)
      })
    ),
    deps: [BillService]
  }]
})
export class BillSummaryComponent implements OnInit {

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              public smartTableService: SmartTableService) {
  }

  ngOnInit() {
  }

  fetchBills(dateParams?: any) {
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
