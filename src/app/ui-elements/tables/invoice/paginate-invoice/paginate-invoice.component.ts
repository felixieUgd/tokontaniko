import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { SortDirection } from 'smart-table-core';
import { SmartTable, of } from 'smart-table-ng';
import { AppService } from 'src/app/app.service';
import { SmartTableService } from 'src/app/_services/smart-table.service';
import { UtilityService } from 'src/app/_services/utility.service';
import { InvoiceService } from 'src/app/income/invoice/invoice.service';

@Component({
  selector: 'app-paginate-invoice',
  templateUrl: './paginate-invoice.component.html',
  providers: [{
    provide: SmartTable,
    useFactory: () => of([]),
    deps: [InvoiceService]
  }]
})
export class PaginateInvoiceComponent implements OnInit, OnChanges {
  @Input() data: any;

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              public smartTableService: SmartTableService,
              private utilityService: UtilityService
  ) { }
  
  ngOnInit() {
  }

  bgColor = (status) => this.utilityService.statusStyle(status).background;

  ngOnChanges(changes) {
    const data = changes.data.currentValue;
    const ts = {
      slice: {
        page: 1, size: 25
      },
      sort: {
        pointer: 'created_at',
        direction: SortDirection.DESC
      },
      search: {},
      filter: {}
    }
    if(data) {
      this._table.use(data, ts);
    }
  }
}
