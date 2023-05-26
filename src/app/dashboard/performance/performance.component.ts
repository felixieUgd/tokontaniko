import {Component, OnInit} from '@angular/core';
import {ChartOptions} from 'chart.js';
import {DashboardService} from '../dashboard.service';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ThemeConstants} from '../../shared/config/theme-constant';
import {NotificationService} from '../../_services/notification.service';
import {UserService} from '../../settings/user/user.service';

import * as moment from 'moment';
import _map from 'lodash.map';
import User from '../../models/user';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.css']
})
export class PerformanceComponent implements OnInit {
  filterForm: FormGroup;
  filterFormSubmitted = false;

  barChartType = 'bar';
  barChartLegend = true;
  barChartColors: Array<any>;
  barChartOptions: ChartOptions;

  barChartLabels: string[] = [];
  performanceData: any[];

  donutChartType = 'doughnut';
  donutChartLegend = true;
  donutChartOptions: ChartOptions;
  donutChartColors: any;

  categoryLabels: string[] = [];
  categoryData: number[];
  userLabels: string[] = [];
  userData: number[];

  timelineData = [];
  summaryByStatusCodeData = [];
  summaryByUserData = [];

  users: User[];

  constructor(private colorConfig: ThemeConstants,
              private dashboardService: DashboardService,
              private formBuilder: FormBuilder,
              private notification: NotificationService,
              private userService: UserService) {
  }

  ngOnInit() {
    this.initForm();
    this.initChartOptions();

    this.getPerformanceReport();
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

  private initForm() {
    this.filterForm = this.formBuilder.group({
      start: [moment().startOf('week').toDate(), Validators.required],
      end: [moment().endOf('week').toDate(), Validators.required],
      user: null
    });

    this.getPerformanceReport();

    this.userService.list()
      .toPromise()
      .then(users => {
        this.users = users;
      });
  }

  private mapChartData(data) {
    return _map(this.barChartLabels, item => {
      const day = moment(item, 'DD MMM');
      const filtered = data.filter(elem => day.isSame(moment(elem.Day, 'YYYY-MM-DD'), 'day'));

      return filtered.length > 0 ? filtered[0].count : 0;
    });
  }

  getPerformanceReport() {
    const formValue = this.filterForm.getRawValue();
    const userFilter = (formValue.user && formValue.user.id) ? {
      user_id: [{
        operator: 'equals',
        type: 'number',
        value: formValue.user.id
      }]
    } : null;

    const paginationOptions = {
      filter: {
        ...userFilter,
        created_at: [
          {
            operator: 'gte',
            type: 'string',
            value: moment(formValue.start).format()
          },
          {
            operator: 'lte',
            type: 'numeric',
            value: moment(formValue.end).format()
          }
        ]
      },
      slice: {
        size: 1000
      },
      sort: {
        pointer: 'created_at',
        direction: 'desc'
      }
    };

    this.dashboardService.getReport({type: 'userRequestStatistics'}, paginationOptions)
      .then(res => {
        this.initBarChartLabels();

        this.categoryLabels.length = 0;
        this.categoryData = [];

        this.userLabels.length = 0;
        this.userData = [];

        const histories = this.mapChartData(res.summaryByDate);

        // Bar chart data
        this.performanceData = [
          {data: histories, label: 'Actions', stack: 'a'}
        ];

        this.summaryByStatusCodeData = res.summaryByStatusCode;
        this.summaryByStatusCodeData.forEach(item => {
          this.categoryLabels.push(`${item.Type}`);
          this.categoryData.push(+item.count);
        });

        this.summaryByUserData = res.summaryByUser;
        this.summaryByUserData.forEach(item => {
          this.userLabels.push(`${item.User.name}`);
          this.userData.push(+item.count);
        });
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  handleCategoryChartClick(e) {
    const formValue = this.filterForm.getRawValue();
    const userFilter = (formValue.user && formValue.user.id) ? {
      user_id: [{
        operator: 'equals',
        type: 'number',
        value: formValue.user.id
      }]
    } : null;

    const paginationOptions = {
      filter: {
        ...userFilter,
        created_at: [
          {
            operator: 'gte',
            type: 'string',
            value: moment(formValue.start).format()
          },
          {
            operator: 'lte',
            type: 'numeric',
            value: moment(formValue.end).format()
          }
        ],
        status_code: [
          {
            operator: 'equals',
            type: 'string',
            value: this.summaryByStatusCodeData[e.active[0]._index].Type
          }
        ]
      },
      search: {},
      slice: {
        size: 100,
        page: 1
      },
      sort: {
        pointer: 'created_at',
        direction: 'desc'
      }
    };

    this.dashboardService.getReport({type: 'timeline'}, paginationOptions)
      .then(res => {
        this.timelineData = res.data; // todo: use stTable
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  handleUserChartClick(e) {
    this.filterForm.patchValue({
      user: this.summaryByUserData[e.active[0]._index].User
    });

    this.getPerformanceReport();
  }

  resetForm() {
    this.filterFormSubmitted = false;
    this.filterForm.reset({
      start: moment().startOf('week').toDate(),
      end: moment().endOf('week').toDate(),
      user: null
    });
    this.timelineData.length = 0;
  }
}
