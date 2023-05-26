import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ChartOptions} from 'chart.js';
import {RequestSummary, RequestType} from 'src/app/models/request';
import {ThemeConstants} from 'src/app/shared/config/theme-constant';
import {NotificationService} from 'src/app/_services/notification.service';
import {MaintenanceService} from '../maintenance.service';

import * as moment from 'moment';
import _map from 'lodash.map';
import {of, SmartTable, TableState} from 'smart-table-ng';

import server from 'smart-table-server';
import {UtilityService} from 'src/app/_services/utility.service';
import {SessionService} from 'src/app/_services/session.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {AppService} from 'src/app/app.service';
import {FilterOperator} from 'smart-table-filter';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MaintenanceDetailComponent} from '../maintenance-detail/maintenance-detail.component';

const KEY = 'TS_MAINTENANCE_DASHBOARD';

@Component({
  selector: 'app-maintenance-dashboard',
  templateUrl: './maintenance-dashboard.component.html',
  styleUrls: ['./maintenance-dashboard.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: (maintenanceService: MaintenanceService) => of(
      [],
      maintenanceService.getDashboardConfig(KEY),
      server({
        query: (tableState) => maintenanceService.paginate(tableState, KEY)
      })
    ),
    deps: [MaintenanceService]
  }]
})
export class MaintenanceDashboardComponent implements OnInit {

  filterForm: FormGroup;
  submitted = false;
  loading = false;

  requestSummary: RequestSummary;

  barChartType = 'bar';
  barChartLegend = true;
  barChartColors: Array<any>;
  barChartOptions: ChartOptions;

  barChartLabels: string[] = [];
  requestData: any[];

  donutChartType = 'doughnut';
  donutChartLegend = true;
  donutChartOptions: ChartOptions;
  donutChartColors: any;

  typeLabels: string[] = [];
  typeData: number[];

  timelineData = [];
  summaryByTypeData = [];

  selectedStatus: string;

  types: RequestType[];

  activeMenu: any;

  constructor(public _table: SmartTable<any>,
              public smartTableService: SmartTableService,
              public appService: AppService,
              public maintenanceService: MaintenanceService,
              public utilityService: UtilityService,
              private sessionService: SessionService,
              private modalService: NgbModal,
              private colorConfig: ThemeConstants,
              private formBuilder: FormBuilder,
              private notification: NotificationService,
  ) { }

  ngOnInit() {
    this.activeMenu = this.sessionService.getActiveMenu();
    this.requestSummary = {
      approved: 0,
      total: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0
    };

    this.initForm();
    this.initFilters();
    this.initChartOptions();
  }

  edit(id: number) {
    const ref = this.modalService.open(MaintenanceDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'full-modal'
    });
    ref.componentInstance.isModal = true;
    ref.componentInstance.id = id;

    ref.result.catch(res => {
      if (res) {
        this.getSummary();
        this._table.exec();
      }
    });
  }

  filterBy(type: string, value?: string) {
    if (type === 'status') {
      this.selectedStatus = value;
    }

    if (value) {
      this.maintenanceService.filterBy(this._table, type, value, FilterOperator.EQUALS);
    }
    else this.maintenanceService.clearFilter(this._table, type);
  }

  getSummary() {
    this.loading = true;

    if (this.filterForm.valid) {
      const formValue = this.filterForm.getRawValue();
      let createdAtFilter = [];

      const typeFilter = {
        request_type_id: formValue.request_type_id ? [{
          operator: FilterOperator.EQUALS,
          type: 'number',
          value: formValue.request_type_id
        }] : undefined
      };

      if (formValue.start) {
        createdAtFilter.push({
          value: moment(formValue.start).format(),
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      if (formValue.end) {
        createdAtFilter.push({
          value: moment(formValue.end).format(),
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      const body = {
        filter: {
          created_at: (createdAtFilter.length) ? createdAtFilter : undefined,
          ...typeFilter
        }
      };

      this.maintenanceService.summary(body)
        .toPromise()
        .then(res => {
          this.requestSummary.total = res[0];
          this.requestSummary.approved = res[1];
          this.requestSummary.in_progress = res[2];
          this.requestSummary.on_hold = res[3];
          this.requestSummary.completed = res[4];
        })
        .catch(err => {
          this.notification.error(null, err.error);
          console.log(err);
        })
        .finally(() => {
          this.loading = false;
        });
    }
    else this.notification.error(null, 'FORM_NOT_VALID');
  }

  handleTypeChartClick(e) {
    if (e.active[0]) {
      const type = this.summaryByTypeData[e.active[0]._index].RequestType;
  
      this.filterForm.patchValue({
        request_type_id: type ? type.id : undefined
      });
  
      this.loadRequestReports();
    }
  }

  loadRequestReports() {
    const formValue = this.filterForm.getRawValue();
    const typeFilter = {
      request_type_id: formValue.request_type_id? [{
        operator: FilterOperator.EQUALS,
        type: 'number',
        value: formValue.request_type_id
      }]: undefined
    };

    this._table.filter({
      ...typeFilter,
      created_at: [
        {
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string',
          value: moment(formValue.start).format()
        },
        {
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'numeric',
          value: moment(formValue.end).format()
        }
      ]
    });

    this.initBarChartLabels();

    this.typeLabels.length = 0;
    this.typeData = [];

    const histories = this.mapChartData([
      {
        Day: '2022-10-05',
        count: 5
      },
      {
        Day: '2022-10-07',
        count: 2
      },
      {
        Day: '2022-10-04',
        count: 8
      }
    ]);

    // Bar chart data
    this.requestData = [
      {data: histories, label: 'Requêtes', stack: 'a'}
    ];

    this.summaryByTypeData = [
      {
        RequestType: this.types.find(x => x.id === 1),
        count: 2
      },
      {
        RequestType: this.types.find(x => x.id === 2),
        count: 4
      },
      {
        RequestType: this.types.find(x => x.id === 4),
        count: 10
      }
    ];

    this.summaryByTypeData.forEach(item => {
      this.typeLabels.push(`${item.RequestType.name}`);
      this.typeData.push(+item.count);
    });

    this.getSummary();
  }

  resetForm() {
    this.submitted = false;
    this.selectedStatus = null;
    this.filterForm.reset({
      start: [moment().startOf('week').startOf('day').toDate(), Validators.required],
      end: [moment().endOf('week').endOf('day').toDate(), Validators.required],
      request_type_id: null
    });
    this.timelineData.length = 0;

    sessionStorage.removeItem(KEY);
    this.maintenanceService.clearFilter(this._table, ['created_at', 'request_type_id', 'status']);
    this.getSummary();
  }

  private initBarChartLabels() {
    this.barChartLabels.length = 0;

    const start = moment(this.filterForm.get('start').value);
    const end = moment(this.filterForm.get('end').value);

    while (start.isSameOrBefore(end)) {
      this.barChartLabels.push(start.format('DD MMM'));
      start.add(1, 'day');
    }
  }

  private initChartOptions() {
    const themeColors = this.colorConfig.get().colors;

    this.barChartColors = [
      {
        backgroundColor: themeColors.infoInverse,
        borderColor: themeColors.info,
        borderWidth: 2
      }
    ];
    this.barChartOptions = {
      responsive: true,
      // We use these empty structures as placeholders for dynamic theming.
      scales: {
        xAxes: [{}],
        yAxes: [{
          ticks: {
            stepSize: 100
          }
        }]
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
        }
      }
    };

    this.donutChartColors = [{
      backgroundColor: [themeColors.info, themeColors.primary, themeColors.success, themeColors.gray],
      pointBackgroundColor: [themeColors.info, themeColors.primary, themeColors.success, themeColors.gray]
    }];
    this.donutChartOptions = {
      responsive: true,
      legend: {
        position: 'right',
        align: 'start'
      },
      cutoutPercentage: 75,
      maintainAspectRatio: false
    };
  }

  private getFilterValueId(filter: any, property: string) {
    if (!filter || !filter[property] || !filter[property].length)
      return null;

    return filter[property][0].value;
  }

  private initFilters() {
    const sessionState = sessionStorage.getItem(KEY);
    if (sessionState) {
      const tableState: TableState = JSON.parse(sessionState);
      const filter = tableState.filter;

      if (filter && filter['created_at']) {
        const requestedAtFilter = tableState.filter['created_at'] as Array<any>;
        const typeFilter = tableState.filter['request_type_id'] as Array<any>;
        this.filterForm.patchValue({
          start: requestedAtFilter ? moment(requestedAtFilter[0].value).toDate() : undefined,
          end: requestedAtFilter.length > 1 ? moment(requestedAtFilter[1].value).toDate() : undefined,
          request_type_id: typeFilter? typeFilter[0].value: null
        });
      }

      this.selectedStatus = this.getFilterValueId(filter, 'status');

    }
  }

  private initForm() {
    this.filterForm = this.formBuilder.group({
      start: [moment().startOf('week').startOf('day').toDate(), Validators.required],
      end: [moment().endOf('week').endOf('day').toDate(), Validators.required],
      request_type_id: null
    });


    this.maintenanceService.getTypes({type: 'all'})
      .toPromise()
      .then(types => {
        this.types = types;

        this.loadRequestReports();
      }).catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private mapChartData(data) {
    return _map(this.barChartLabels, item => {
      const day = moment(item, 'DD MMM');
      const filtered = data.filter(elem => day.isSame(moment(elem.Day, 'YYYY-MM-DD'), 'day'));

      return filtered.length > 0 ? filtered[0].count : 0;
    });
  }

}
