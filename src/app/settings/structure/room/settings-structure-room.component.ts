import { Component, OnInit } from '@angular/core';

import server from 'smart-table-server';
import {of as ofST, SmartTable, TableState} from 'smart-table-ng';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {RoomService} from 'src/app/_services/room.service';
import Room from 'src/app/models/room';
import RoomType from 'src/app/models/room-type';
import {NotificationService} from 'src/app/_services/notification.service';
import {concat, Observable, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {MenService} from 'src/app/men/men.service';

@Component({
  selector: 'app-settings-structure-room',
  templateUrl: './settings-structure-room.component.html',
  styleUrls: ['./settings-structure-room.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: (roomService: RoomService) => ofST(
      [],
      roomService.getConfig(),
      server({
        query: (tableState) => roomService.paginate(tableState)
      })
    ),
    deps: [RoomService]
  }]
})
export class SettingsStructureRoomComponent implements OnInit {

  room?: Room;
  roomForm: FormGroup;

  loading: boolean;
  sidePanelOpen: boolean;
  submitted: boolean;

  subscriptions = [];
  types: RoomType[];

  facilityInput$ = new Subject<string>();
  searchFacility$: Observable<any>;
  isFacilityLoading: boolean = false;

  constructor(private formBuilder: FormBuilder,
    private _table: SmartTable<any>,
    private translate: TranslateService,
    private menService: MenService,
    private roomService: RoomService,
    private notification: NotificationService) {
  }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.fetchRoomTypes();
    this.initForm();
  }

  ngOnDestroy() {
    if (this.subscriptions.length) {
      for (const elem of this.subscriptions) {
        elem.unsubscribe();
      }
    }
  }

  close() {
    this.room = null;
    this.loading = false;
    this.sidePanelOpen = false;
    this.submitted = false;

    this.roomForm.reset({
      enabled: true
    });
  }

  edit(room: Room) {
    this.room = room;
    this.roomForm.patchValue(room);
    this.sidePanelOpen = true;
  }

  formatter = (text) => {
    if (text) {
      const subscription = this.translate.get('rooms_category.' + text).subscribe((res: string) => text = res);
      this.subscriptions.push(subscription);
    }

    return text;
  }

  save() {
    this.submitted = true;

    if (this.roomForm.valid) {
      const formValue = this.roomForm.getRawValue();

      if (this.room) {
        const body = Object.assign({}, formValue, {id: this.room.id, facility_id: formValue.Facility ? formValue.Facility.id: undefined});
        this.roomService.update(body)
          .toPromise()
          .then(res => {
            this._table.exec();
            this.close();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        const body = Object.assign({}, formValue, {facility_id: formValue.Facility ? formValue.Facility.id : undefined});
        this.roomService.create(body)
          .toPromise()
          .then(res => {
            this._table.exec();
            this.close();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private fetchRoomTypes() {
    this.roomService.listType()
      .toPromise()
      .then(res => this.types = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.roomForm = this.formBuilder.group({
      title: [null, Validators.required],
      room_type_id: [null, Validators.required],
      Facility: null,
      description: null,
      enabled: true
    });

    this.searchFacility$ = concat(
      of([]),
      this.facilityInput$.pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.length <= 3)
            return [];

          const ts: TableState = {
            sort: {},
            slice: {
              page: 1,
              size: 10
            },
            filter: {},
            search: {
              scope: ['name'],
              value: term
            }
          }
          this.isFacilityLoading = true;
          return this.menService.paginateByUserGeography(ts, 'TS_STORAGE_FACILITY')
            .then(res => {
              return res && res.data.length > 0 ? res.data : [];
            })
            .catch(err => {
              this.notification.error(null, err.error);
            }).finally(() => {
              this.isFacilityLoading = false;
            })
        })
      )
    );
  }

}
