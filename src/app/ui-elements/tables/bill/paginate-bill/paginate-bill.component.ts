import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { SmartTable, of } from 'smart-table-ng';
import { BillService } from 'src/app/expense/bill/bill.service';
import { AppService } from 'src/app/app.service';
import { SmartTableService } from 'src/app/_services/smart-table.service';
import { SortDirection } from 'smart-table-sort';
import { UtilityService } from 'src/app/_services/utility.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paginate-bill',
  templateUrl: './paginate-bill.component.html',
  styleUrls: ['../../../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: () => of([]),
    deps: [BillService]
  }]
})
export class PaginateBillComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() detailUrl: string = '/expense/bill/detail';

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              public smartTableService: SmartTableService,
              private router: Router,
              private modalService: NgbModal,
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

  navigateTo(route: any[]) {
    if (!route[1]) {
      return;
    }
    this.router.navigate(route);
    this.modalService.dismissAll();
  }

  viewDetail(id: number) {
    if (!id) {
      return;
    }
    this.router.navigate([this.detailUrl, id]);
    this.modalService.dismissAll();
  }

}
