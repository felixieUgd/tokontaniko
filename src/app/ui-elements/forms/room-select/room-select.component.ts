import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {Subject, Observable, concat, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {TableState} from 'smart-table-ng';
import {RoomService} from 'src/app/_services/room.service';
import {InventoryService} from 'src/app/inventory/inventory.service';
import {MenService} from 'src/app/men/men.service';
import Facility from 'src/app/models/facility';
import Room from 'src/app/models/room';
import {NotificationService} from 'src/app/_services/notification.service';

@Component({
  selector: 'app-room-select',
  templateUrl: './room-select.component.html',
  styleUrls: ['./room-select.component.css']
})
export class RoomSelectComponent implements OnInit {
  @Input()
  submitted: boolean = false;
  @Input()
  keepSession: boolean = false;
  @Input()
  id: string;

  @Output()
  change = new EventEmitter<Room>();

  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  selectedRoom: Room;
  selectedFacility: Facility;

  facilityInput$ = new Subject<string>();
  searchFacility$: Observable<any> = concat(
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

  isFacilityLoading: boolean = false;

  constructor(
    private menService: MenService,
    private roomService: RoomService,
    private notification: NotificationService
  ) { }

  get key() {
    return this.id? 'ROOM_SELECT' + this.id : InventoryService.KEY;
  }

  ngOnInit() {
    this.loadRooms();
  }

  facilityChange(facility: Facility) {
    this.filteredRooms = facility ? this.rooms.filter(room => room.Facility && room.Facility.id === facility.id) : [];
    this.selectedFacility = facility;
    this.roomChange(null);
  }

  roomChange(room: Room) {
    this.selectedRoom = room;
    this.change.next(this.selectedRoom);

    if (this.keepSession) {
      sessionStorage.setItem(this.key, JSON.stringify({
        room: this.selectedRoom,
        facility: this.selectedFacility
      }));
    }
  }

  private loadRooms() {
    this.roomService.list().toPromise().then(rooms => {
      this.rooms = rooms;
      this.filteredRooms = [];

      if (this.keepSession) {
        const saved = JSON.parse(sessionStorage.getItem(this.key));
        if (saved) {
          this.facilityChange(saved.facility);
          this.roomChange(saved.room);
        }
      }
    }).catch(err => this.notification.error(null, err.error));
  }

}
