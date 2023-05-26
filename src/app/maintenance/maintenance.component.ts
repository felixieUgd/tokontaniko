import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {MaintenanceService} from './maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {UserService} from 'src/app/settings/user/user.service';

import {SmartTable, of as ofST, TableState} from 'smart-table-ng';
import server from 'smart-table-server';
import {FilterOperator} from 'smart-table-core';
import {concat, of, Subject} from 'rxjs';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';

import Category from '../models/category';
import Request, {RequestStatus, RequestSummary} from 'src/app/models/request';
import User from 'src/app/models/user';
import Room from '../models/room';

import {AppService} from '../app.service';
import {CategoryService} from '../accounting/category/category.service';
import {ExportService} from '../_services/export.service';
import {SessionService} from '../_services/session.service';
import {SmartTableService} from '../_services/smart-table.service';
import {UtilityService} from '../_services/utility.service';
import {RoomService} from '../_services/room.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (maintenanceService: MaintenanceService) => ofST(
      [],
      maintenanceService.getConfig(),
      server({
        query: (tableState) => maintenanceService.paginate(tableState)
      })
    ),
    deps: [MaintenanceService]
  }]
})
export class MaintenanceComponent implements OnInit {
  staffInput$ = new Subject<string>();

  categories: Observable<Category[]>;
  dateForm: FormGroup;
  drafts: Request[] = [];
  requestStatuses: Promise<RequestStatus[]>
  requestSummary: RequestSummary;
  loading: boolean;
  rooms: Promise<Room[]>;
  selectedCategoryId: number;
  selectedLocalId: number;
  selectedStaff: User;
  users: Array<User>;

  activeMenu: any;

  selectedStatusId: number;
  submitted: boolean;

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    public smartTableService: SmartTableService,
    public utilityService: UtilityService,
    public maintenanceService: MaintenanceService,
    private categoryService: CategoryService,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private roomService: RoomService,
    private notification: NotificationService,
    private translateService: TranslateService,
    private sessionService: SessionService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.maintenanceService.urlParams = null;
    this.categories = this.categoryService.list({type: 'maintenance'});
    this.requestStatuses = this.maintenanceService.getListBy('status', {type: 'all'});
    this.rooms = this.roomService.getRooms();
    this.requestSummary = {
      approved: 0,
      total: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0
    };

    this.activeMenu = this.sessionService.getActiveMenu();

    this.initForm();
    this.initFilters();
    this.getSummary();
  }

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

  exportExcelV2(data: Request[], filename: string) {
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
      line['ID Requête'] = request.id;
      line['ID Local'] = request.room_id;
      line['Nom Local'] = request.Room? request.Room.title: null;
      line['Catégorie'] = request.Category? request.Category.name: null;
      line['Contact'] = contacts;
      line['Titre'] = request.title;
      line['Description'] = request.description;
      line['Assignée à'] = staffs;
      line['Créée le'] = moment(request.created_at).format('DD MMM YYYY');
      line['Etat'] = this.translateService.instant('status.' + request.status);
      line['Age (jours)'] = moment().diff(moment(request.created_at), 'days');
      line['Dernière activité'] = lastHistory || null;
      line['Date dernière activité'] = lastHistoryDate? moment(lastHistoryDate).format('DD MMM YYYY HH:mm'): null;
      return line;
    });

    this.exportService.exportToExcel(mapped, filename);
  }

  filterBy(type: string, value?: any) {
    if (value) {
      this.setUrlParams();
      this.maintenanceService.filterBy(this._table, type, value, FilterOperator.EQUALS);
    }
    else this.maintenanceService.clearFilter(this._table, type);
  }

  filterResult() {
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

      this.setUrlParams();
      this.getSummary();
      this._table.filter({
        created_at: (createdAtFilter.length) ? createdAtFilter : undefined
      });
    }
  }

  getLastHistoryDate(histories: any[]) {
    if (histories && histories.length > 0) {
      return histories[0].created_at;
    }
    return null;
  }

  getSummary() {
    this.loading = true;

    if (this.dateForm.valid) {
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
          created_at: (createdAtFilter.length) ? createdAtFilter : undefined
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
          this.drafts = res[5];
        })
        .catch(err => this.notification.error(null, err.error))
        .finally(() => {
          this.loading = false;
        });
    }
    else this.notification.error(null, 'FORM_NOT_VALID');
  }

  isMine = (request: Request) => this.maintenanceService.isMine(request);

  onSelectStaff(event) {
    if (event) {
      this.setUrlParams();
    }
    else {
      this.selectedStaff = null;
      this.maintenanceService.urlParams = null;
    }

    this._table.exec();
    this.getSummary();
  }

  resetForm() {
    this.dateForm.reset({
      start: null,
      end: null
    });
    this.selectedCategoryId = null;
    this.selectedLocalId = null;
    this.selectedStaff = null;
    this.selectedStatusId = null;
    this.submitted = false;
    this.maintenanceService.urlParams = null;

    sessionStorage.removeItem(MaintenanceService.TS_KEY);

    this.maintenanceService.clearFilter(this._table, ['requested_at', 'created_at', 'request_status_id', 'room_id', 'status']);
    this.getSummary();
  }

  private getFilterValueId(filter: any, property: string) {
    if (!filter || !filter[property] || !filter[property].length)
      return null;

    return filter[property][0].value;
  }

  private initFilters() {
    const sessionState = sessionStorage.getItem(MaintenanceService.TS_KEY);
    if (sessionState) {
      const tableState: TableState = JSON.parse(sessionState);
      const filter = tableState.filter;

      if (filter) {
        const createdAtFilter = tableState.filter['created_at'] as Array<any>;

        this.dateForm.patchValue({
          start: createdAtFilter && createdAtFilter.length ? moment(createdAtFilter[0].value).toDate() : undefined,
          end: createdAtFilter && createdAtFilter.length > 1 ? moment(createdAtFilter[1].value).toDate() : undefined
        });
      }

      this.selectedStatusId = this.getFilterValueId(filter, 'request_status_id');
      this.selectedLocalId = this.getFilterValueId(filter, 'room_id');
      this.selectedCategoryId = this.getFilterValueId(filter, 'category_id');
    }
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: null,
      end: null
    });

    this.sessionService.setDateForm(this.dateForm, MaintenanceService.TS_KEY, 'created_at');
  }

  private setUrlParams() {
    if (this.selectedStaff) {
      this.maintenanceService.urlParams = this.selectedStaff ? {staff_id: this.selectedStaff.id} : null;
    }
  }
}
