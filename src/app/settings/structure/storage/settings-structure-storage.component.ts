import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {concat, Observable, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {TableState} from 'smart-table-ng';
import {RoomService} from 'src/app/_services/room.service';
import {MenService} from 'src/app/men/men.service';
import {InventoryStorage} from 'src/app/models/item';
import Room from 'src/app/models/room';
import {NotificationService} from 'src/app/_services/notification.service';
import {SettingsStructureStorageService, STORAGE_TYPES} from './settings-structure-storage.service';

@Component({
  selector: 'app-settings-structure-storage',
  templateUrl: './settings-structure-storage.component.html',
  styleUrls: ['./settings-structure-storage.component.css']
})
export class SettingsStructureStorageComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];

  storage?: InventoryStorage;
  storages?: InventoryStorage[];
  storageForm: FormGroup;

  loading: boolean;
  sidePanelOpen: boolean;
  submitted: boolean;

  subscriptions = [];
  types = STORAGE_TYPES;

  facilityInput$ = new Subject<string>();
  searchFacility$: Observable<any>;
  isFacilityLoading: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private menService: MenService,
              private roomService: RoomService,
              private storageService: SettingsStructureStorageService,
              private notification: NotificationService) {
  }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.initForm();
    this.valueChanges();
    this.fetchRooms();
    this.fetchStorages();
  }

  ngOnDestroy() {
    if (this.subscriptions.length) {
      for (const elem of this.subscriptions) {
        elem.unsubscribe();
      }
    }
  }

  close() {
    this.storage = null;
    this.loading = false;
    this.sidePanelOpen = false;
    this.submitted = false;

    this.storageForm.reset({
      enabled: true
    });
  }

  edit(storage: InventoryStorage) {
    this.storage = storage;
    let facility = null;
    if (storage.Room) {
      const room = this.rooms.find(room => room.id === storage.Room.id);
      if (room) {
        facility = room.Facility;
      }
    }

    const data = {
      ...storage,
      room: storage.Room,
      facility
    };

    delete data.Room;

    this.storageForm.patchValue(data);
    this.sidePanelOpen = true;
  }

  save() {
    this.submitted = true;

    if (this.storageForm.valid) {
      const formValue = this.storageForm.getRawValue();
      const body = {
        ...formValue,
        room_id: formValue.room ? formValue.room.id : undefined,
        facility_id: formValue.facility ? formValue.facility.id : undefined
      };
      delete body.facility;
      delete body.room;

      if (this.storage) {
        this.storageService.update(this.storage.id, body)
          .toPromise()
          .then(res => {
            this.fetchStorages();
            this.close();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        this.storageService.create(body)
          .toPromise()
          .then(res => {
            this.fetchStorages();
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

  private fetchRooms() {
    this.roomService.list().toPromise()
      .then(rooms => {
        this.rooms = rooms;
        this.filteredRooms = [];
      }).catch(err => this.notification.error(null, err.error));
  }

  private fetchStorages() {
    this.storageService.list()
      .toPromise()
      .then(res => this.storages = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.storageForm = this.formBuilder.group({
      name: [null, Validators.required],
      facility: [null, Validators.required],
      room: [null, Validators.required],
      type: [null, Validators.required],
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
          };
          this.isFacilityLoading = true;
          return this.menService.paginate(ts, 'TS_STORAGE_FACILITY')
            .then(res => {
              return res && res.data.length > 0 ? res.data : [];
            })
            .catch(err => {
              this.notification.error(null, err.error);
            })
            .finally(() => {
              this.isFacilityLoading = false;
            });
        })
      )
    );
  }

  private valueChanges() {
    this.subscriptions.push(
      this.storageForm.get('facility').valueChanges.subscribe(facility => {
        this.filteredRooms = facility ? this.rooms.filter(room => room.Facility && room.Facility.id === facility.id) : [];
      })
    );
  }

}
