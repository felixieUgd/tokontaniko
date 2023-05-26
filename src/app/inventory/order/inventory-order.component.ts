import { Component, OnDestroy, OnInit } from '@angular/core';
import {FormGroup, FormBuilder} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import * as moment from 'moment';
import {Subject, Observable, Subscription, concat, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {SmartTable, TableState, of as ofST} from 'smart-table-ng';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {AppService} from 'src/app/app.service';
import {RoomService} from 'src/app/_services/room.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {MenService} from 'src/app/men/men.service';
import Category from 'src/app/models/category';
import Facility from 'src/app/models/facility';
import {RequestSummary, RequestStatus} from 'src/app/models/request';
import Room from 'src/app/models/room';
import Request from 'src/app/models/request';
import User from 'src/app/models/user';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {UserService} from 'src/app/settings/user/user.service';
import {ExportService} from 'src/app/_services/export.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {InventoryService} from '../inventory.service';
import {FilterOperator} from 'smart-table-filter';
import server from 'smart-table-server';

const KEY = 'TS_INVENTORY_ORDER';

@Component({
  selector: 'app-inventory-order',
  templateUrl: './inventory-order.component.html',
  styleUrls: ['./inventory-order.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: (maintenanceService: MaintenanceService, inventoryService: InventoryService) => ofST(
      [],
      inventoryService.getOrderConfig(KEY),
      server({
        query: (tableState) => maintenanceService.paginate(tableState, KEY)
      })
    ),
    deps: [MaintenanceService, InventoryService]
  }]
})
export class InventoryOrderComponent implements OnInit, OnDestroy {

  staffInput$ = new Subject<string>();

  categories: Observable<Category[]>;
  dateForm: FormGroup;
  requestSummary: RequestSummary;
  rooms: Promise<Room[]>;
  selectedCategory: number;
  selectedRoom: number;
  selectedStaff: User;
  selectedFacility: Facility;
  selectedStatus: number;

  loading: boolean;
  submitted: boolean;
  typedSearch: string;

  subscription: Subscription;

  requestStatuses: Observable<RequestStatus[]>;

  isFacilityLoading = false;
  facilityInput$ = new Subject<string>();
  searchFacility$ = concat(
    of([]),
    this.facilityInput$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length <= 3)
          return [];
        this.isFacilityLoading = true;
        return this.menService.select(term)
          .toPromise()
          .then(res => {
            return res && res.length > 0 ? res : [];
          })
          .catch(err => {
            this.notification.error(null, err.error);
          }).finally(() => {
            this.isFacilityLoading = false;
          })
      })
    )
  );

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    public maintenanceService: MaintenanceService,
    public smartTableService: SmartTableService,
    public utilityService: UtilityService,
    private categoryService: CategoryService,
    private menService: MenService,
    private formBuilder: FormBuilder,
    private sessionService: SessionService,
    private inventoryService: InventoryService,
    private roomService: RoomService,
    private translateService: TranslateService,
    private notification: NotificationService,
    private exportService: ExportService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.categories = this.categoryService.list({type: 'maintenance'});
    this.rooms = this.roomService.getRooms();
    this.requestSummary = {
      approved: 0,
      total: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0
    };

    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    let defaultId: number = null;

    if (!settings || !settings['default_inventory_category']) {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }
    else {
      defaultId = +settings['default_inventory_category'];
    }

    this.requestStatuses = this.maintenanceService.listStatus(defaultId, true);

    this.initForm();
    this.initFilters();
    this.getSummary();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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

  export(data: Request[]) {
    const formValue = this.dateForm.getRawValue();
    let filename = 'Commande';

    if (formValue.start) {
      filename += '_' + moment(formValue.start).format('DDMMYYYY');
    }
    if (formValue.end) {
      filename += '_' + moment(formValue.end).format('DDMMYYYY');
    }

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
      line['ID'] = request.id;
      line['Date'] = moment(request.requested_at).format('DD MMM YYYY');
      line['Etablissement'] = request.Facility ? request.Facility.name : null;
      line['Local'] = request.Room ? request.Room.title : null;
      line['Catégorie'] = request.Category ? request.Category.name : null;
      line['Fournisseur'] = contacts;
      line['Description'] = request.description;
      line['Assignée à'] = staffs;
      line['Etat intermédiaire'] = request.RequestStatus ? request.RequestStatus.name : null;
      line['Statut'] = this.translateService.instant('status.' + request.status);
      line['Dernière activité'] = lastHistory || null;
      line['Date dernière activité'] = lastHistoryDate ? moment(lastHistoryDate).format('DD MMM YYYY HH:mm') : null;

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

  filterByDate() {
    this.submitted = true;

    if (this.dateForm.valid) {
      let requestedAtFilter = [];
      const formValue = this.dateForm.getRawValue();

      if (formValue.start) {
        requestedAtFilter.push({
          value: moment(formValue.start).startOf('day').format(),
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      if (formValue.end) {
        requestedAtFilter.push({
          value: moment(formValue.end).endOf('day').format(),
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      this.setUrlParams();
      this.getSummary();
      this._table.filter({
        requested_at: (requestedAtFilter.length) ? requestedAtFilter : undefined
      });
    }
  }

  filterByExtendedStatus(event: RequestStatus | null) {
    this.setUrlParams();

    if (event) {
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
      this.selectedStatus = null;
    }
  }

  getLatestHistory = (request: Request) => this.maintenanceService.getLatestHistory(request.RequestHistories);

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
      let requestedAtFilter = [];

      if (formValue.start) {
        requestedAtFilter.push({
          value: moment(formValue.start).startOf('day').format(),
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      if (formValue.end) {
        requestedAtFilter.push({
          value: moment(formValue.end).endOf('day').format(),
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'string'
        });
      }

      const typeId = this.inventoryService.getDefaultOrderTypeId();

      const body = {
        filter: {
          requested_at: (requestedAtFilter.length) ? requestedAtFilter : undefined,
          request_type_id: (typeId && !isNaN(typeId)) ? [
            {
              value: typeId,
              operator: FilterOperator.EQUALS,
              type: 'number'
            }
          ] : undefined
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
        })
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

  resetFilter() {
    this.dateForm.reset({
      start: null,
      end: null
    });
    this.maintenanceService.urlParams = null;
    this.selectedCategory = null;
    this.selectedRoom = null;
    this.selectedStatus = null;
    // this.typedSearch = null;
    this.selectedFacility = null;
    this.selectedStaff = null;
    this.setUrlParams();

    sessionStorage.removeItem(KEY);

    this.maintenanceService.clearFilter(this._table, ['category_id', 'created_at', 'requested_at', 'facility_id', 'request_status_id', 'status']);
    this.getSummary();
  }

  private getFilterValueId(filter: any, property: string) {
    if (!filter || !filter[property] || !filter[property].length)
      return null;

    return filter[property][0].value;
  }

  private initFilters() {
    this.selectedStaff = null;
    this.setUrlParams();

    const sessionState = sessionStorage.getItem(KEY);
    if (sessionState) {
      const tableState: TableState = JSON.parse(sessionState);
      const filter = tableState.filter;

      if (filter && filter['requested_at']) {
        const requestedAtFilter = tableState.filter['requested_at'] as Array<any>;
        this.dateForm.patchValue({
          start: moment(requestedAtFilter[0].value).toDate(),
          end: requestedAtFilter.length > 1 ? moment(requestedAtFilter[1].value).toDate() : undefined
        });
      }

      this.selectedCategory = this.getFilterValueId(filter, 'category_id');
      this.selectedRoom = this.getFilterValueId(filter, 'room_id');

      const facilityId = this.getFilterValueId(filter, 'facility_id');
      if (facilityId) {
        this.menService.get(facilityId).then(facility => {
          this.selectedFacility = facility;
        }).catch(err => this.notification.error(null, err.error));
      }
    }
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: null,
      end: null
    });
  }

  private setUrlParams() {
    if (this.selectedStaff) {
      this.maintenanceService.urlParams = this.selectedStaff ? {staff_id: this.selectedStaff.id} : null;
    }
  }

}
