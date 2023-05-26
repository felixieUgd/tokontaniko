import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {NotificationService} from 'src/app/_services/notification.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {UserService} from 'src/app/settings/user/user.service';

import {SmartTable, of as ofST, TableState} from 'smart-table-ng';
import server from 'smart-table-server';
import {FilterOperator} from 'smart-table-core';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';

import Request, {RequestStatus, RequestSummary, RequestType} from 'src/app/models/request';
import User from 'src/app/models/user';

import {AppService} from 'src/app/app.service';
import {ExportService} from 'src/app/_services/export.service';
import {SessionService} from 'src/app/_services/session.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {UtilityService} from 'src/app/_services/utility.service';
import { Subject, concat, of, Observable, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MenService } from '../men.service';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {TranslateService} from '@ngx-translate/core';

const KEY = 'TS_MEN_REQUEST';

@Component({
  selector: 'app-men-request',
  templateUrl: './men-request.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [{
    provide: SmartTable,
    useFactory: (maintenanceService: MaintenanceService, menService: MenService) => ofST(
      [],
      menService.getRequestConfig(KEY),
      server({
        query: (tableState) => maintenanceService.paginate(tableState, KEY)
      })
    ),
    deps: [MaintenanceService, MenService]
  }]
})
export class MenRequestComponent implements OnInit, AfterViewInit {
  dateForm: FormGroup;
  drafts: Request[] = [];
  requestStatuses: Observable<RequestStatus[]>
  requestTypes: Observable<RequestType[]>;
  requestSummary: RequestSummary;

  selectedStaff: User;


  extendedRequestSummary: any;
  selectedStatusId: number;
  submitted: boolean;
  isDataLoaded: boolean;
  loading: boolean;

  staffInput$ = new Subject<string>();
  staff$ = concat(
    of([]),
    this.staffInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.userService.select(term, 'selectByCompany')
        .then(res => {
          return res.length > 0 ? res : [null];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  constructor(
    public _table: SmartTable<any>,
    public utilityService: UtilityService,
    public appService: AppService,
    public maintenanceService: MaintenanceService,
    public smartTableService: SmartTableService,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private translateService: TranslateService,
    private sessionService: SessionService,
    private settingsCompanyService: SettingsCompanyService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.maintenanceService.urlParams = null;
    
    this.requestSummary = {
      approved: 0,
      total: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0
    };

    const interventionCategory = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_intervention_category');

    this.requestStatuses = this.maintenanceService.listStatus(interventionCategory).pipe(
      catchError(err => {
        this.notification.error(null, err.error);
        return throwError(err);
      })
    );
    this.requestTypes = this.maintenanceService.getTypes({type: 'all'}, interventionCategory).pipe(
      catchError(err => {
        this.notification.error(null, err.error);
        return throwError(err);
      })
    );

    this.initForm();
    this.initFilters();
    this.getSummaryByExtendedStatus();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.filterResult();
    }, 0)
  }

  exportExcel(data, filename) {
    const mapped = data.map(request => {
      const lastHistory = this.maintenanceService.getLatestHistory(request.RequestHistories, true);
      const lastHistoryDate = this.getLastHistoryDate(request.RequestHistories);

      let staffs = '';
      if (request.Staffs) {
        request.Staffs.forEach(staff => {
          if (staffs.length) {
            staffs += ', ';
          }

          staffs += staff.name
        });
      }

      let contacts = '';
      if (request.Contacts) {
        request.Contacts.forEach(contact => {
          if (contacts.length) {
            contacts += ', ';
          }

          contacts += contact.name
        });
      }

      const line: any = {};
      line['ID Intervention'] = request.id;
      line['Date'] = moment(request.requested_at).format('DD MMM YYYY');
      line['Etablissement'] = request.Facility ? request.Facility.name : null;
      line['Catégorie'] = request.Category ? request.Category.name : null;
      line['Contact'] = contacts;
      line['Titre'] = request.title;
      line['Description'] = request.description;
      line['Assignée à'] = staffs;
      line['Créée le'] = moment(request.created_at).format('DD MMM YYYY HH:mm');
      line['Etat'] = this.translateService.instant('status.' + request.status);
      line['Etat intermédiaire'] = request.RequestStatus? request.RequestStatus.name: null;
      line['Age (jours)'] = moment().diff(moment(request.created_at), 'days');
      line['Dernière activité'] = lastHistory || null;
      line['Date dernière activité'] = lastHistoryDate ? moment(lastHistoryDate).format('DD MMM YYYY HH:mm') : null;
      return line;
    });

    this.exportService.exportToExcel(mapped, filename);
  }

  filterByStatus(status = null) {
    this.setUrlParams();
    this._table.filter({
      status: status ? [
        {
          value: status,
          operator: FilterOperator.EQUALS,
          type: 'string'
        }
      ] : undefined
    });
  }

  filterByExtendedStatus(event) {
    this.setUrlParams();
    
    if (event) {
      this.selectedStatusId = event.id;
      this._table.filter({
        request_status_id: event ? [
          {
            value: event.id,
            operator: FilterOperator.EQUALS,
            type: 'string'
          }
        ] : undefined
      });
    }
    else {
      this._table.filter({request_status_id: undefined});
      this.selectedStatusId = null;
    }

    this.getSummary();
  }

  filterResult() {
    this.submitted = true;

    if (this.dateForm.valid) {
      let createdAtFilter = [];
      const formValue = this.dateForm.getRawValue();
      const typeFilter = {
        request_type_id: formValue.request_type_id ? [{
          operator: FilterOperator.EQUALS,
          type: 'number',
          value: formValue.request_type_id
        }] : undefined
      };

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

      this.setUrlParams();
      this.getSummary();
      this.getSummaryByExtendedStatus();
      this._table.filter({
        ...typeFilter,
        created_at: (createdAtFilter.length) ? createdAtFilter : undefined
      });

      this.isDataLoaded = true;
    }
  }

  getLastHistoryDate(histories: any[]) {
    if (histories && histories.length > 0) {
      return histories[0].created_at;
    }
    return null;
  }

  isMine(request: Request) {
    const session = this.sessionService.getUser();
    const user_id = session ? session.id : null;
    return (request.Staffs || []).find(item => item.id === user_id);
  }

  onSelectStaff(event: any) {
    if (event) {
      this.setUrlParams();
    }
    else {
      this.selectedStaff = null;
      this.maintenanceService.urlParams = null;
    }

    this._table.exec();
    this.getSummary();
    this.getSummaryByExtendedStatus();
  }

  resetForm() {
    this.dateForm.patchValue({
      end: null,
      start: null
    });
    this.maintenanceService.urlParams = null;
    this.selectedStatusId = null;
    this.selectedStaff = null;
    this.submitted = false;

    sessionStorage.removeItem(KEY);

    this.getSummary();
    this.getSummaryByExtendedStatus();
    this._table.filter({
      created_at: undefined,
      request_status_id: undefined,
      status: undefined
    });
  }

  private getSummary() {
    this.loading = true;

    const formValue = this.dateForm.getRawValue();
    let createdAtFilter = [];

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

    const body = {
      filter: {
        created_at: createdAtFilter.length? createdAtFilter: undefined,
        request_type_id: formValue.request_type_id? [
          {
            value: formValue.request_type_id,
            type: 'number',
            operator: 'equals'
          }
        ]: undefined,
        request_status_id: this.selectedStatusId ? [
          {
            value: this.selectedStatusId,
            type: 'number',
            operator: 'equals'
          }
        ] : undefined
      },
      staff_id: this.selectedStaff ? this.selectedStaff.id : null
    };

    this.maintenanceService.summary(body)
      .toPromise()
      .then(res => {
        this.requestSummary.total = res[0];
        this.requestSummary.approved = res[1];
        this.requestSummary.in_progress = res[2];
        this.requestSummary.on_hold = res[3];
        this.requestSummary.completed = res[4];
        this.drafts = res[5];
      })
      .catch(err => this.notification.error(null, err.error))
      .finally(() => this.loading = false);
  }

  private getSummaryByExtendedStatus() {
    this.loading = true;

    const formValue = this.dateForm.getRawValue();
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

    const body = {
      filter: {
        ...typeFilter,
        '\"Staff\".id': this.selectedStaff ? [
          {
              operator: FilterOperator.EQUALS,
              type: "number",
              value: this.selectedStaff.id
          }
        ] : undefined,
        created_at: (createdAtFilter.length) ? createdAtFilter : undefined
      }
    };

    this.maintenanceService.summaryBy(body, 'summaryByExtendedStatus')
      .then(summary => {
        this.extendedRequestSummary = {};

        this.requestStatuses.toPromise().then(statuses => {

          summary.forEach(item => {
            const matched = statuses.find(elem => elem.name === item.status);

            if (typeof matched !== undefined) {
              this.extendedRequestSummary[item.status] = item.count;
            }
          });
        })
        .catch(err => this.notification.error(null, err.error));
      })
      .catch(err => this.notification.error(null, err.error))
      .finally(() => this.loading = false);
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

      if (filter) {
        const createdAtFilter = tableState.filter['created_at'] as Array<any>;
        const typeFilter = tableState.filter['request_type_id'] as Array<any>;
        
        this.dateForm.patchValue({
          start: createdAtFilter && createdAtFilter.length? moment(createdAtFilter[0].value).toDate(): undefined,
          end: createdAtFilter && createdAtFilter.length > 1 ? moment(createdAtFilter[1].value).toDate() : undefined,
          request_type_id: typeFilter ? typeFilter[0].value : null
        });
      }

      this.selectedStatusId = this.getFilterValueId(filter, 'request_status_id');

    }
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: null,
      end: null,
      request_type_id: [null, Validators.required],
      staff: null
    });

    this.sessionService.setDateForm(this.dateForm, KEY, 'created_at');
  }

  private setUrlParams() {
    const value = this.selectedStaff;

    this.maintenanceService.urlParams = value ? {staff_id: value.id} : null;
  }
}
