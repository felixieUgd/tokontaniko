import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import Room from '../models/room';
import RoomType from '../models/room-type';
import Rent from '../models/rent';

import {TableState} from 'smart-table-ng';
import {DisplayedItem} from 'smart-table-core';

import _filter from 'lodash.filter';
import {AppService} from 'src/app/app.service';

const TS_KEY = 'TS_ROOM';



interface Summary {
  page: number;
  size: number;
  filteredCount: number;
}

interface ServerResult {
  data: DisplayedItem<Room>[];
  summary: Summary;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(private http: HttpClient) {
  }

  create(room: Room): Observable<Room> {
    const url = [AppService.API, 'rooms'].join('/');
    return this.http.post<Room>(url, room);
  }

  createRent(rent: Rent): Observable<Rent> {
    const url = [AppService.API, 'rents'].join('/');
    return this.http.post<Rent>(url, rent);
  }

  createType(roomType: RoomType): Observable<RoomType> {
    const url = [AppService.API, 'roomTypes'].join('/');
    return this.http.post<RoomType>(url, roomType);
  }

  get(id): Promise<Room> {
    const url = [AppService.API, 'rooms', id].join('/');
    return this.http.get<Room>(url).toPromise();
  }

  _getRent(id): Promise<Rent> {
    const url = [AppService.API, 'rents', id].join('/');
    return this.http.get<Rent>(url).toPromise();
  }

  getRooms(): Promise<Room[]> {
    const url = [AppService.API, 'rooms'].join('/');
    return this.http.get<Room[]>(url).toPromise();
  }

  getType(id): Promise<RoomType> {
    const url = [AppService.API, 'roomTypes', id].join('/');
    return this.http.get<RoomType>(url).toPromise();
  }

  getConfig = (): TableState => {
    const search = sessionStorage.getItem(TS_KEY);

    return search ? JSON.parse(search) : {
      search: {},
      filter: {},
      sort: {pointer: 'id', direction: 'asc'},
      slice: {page: 1, size: 25}
    };
  };

  history(id, params): Observable<any[]> {
    const url = [AppService.API, 'rooms', id, 'history'].join('/');
    return this.http.post<any[]>(url, params);
  }

  list(): Observable<Room[]> {
    const url = [AppService.API, 'rooms'].join('/');
    return this.http.get<Room[]>(url);
  }

  listType(): Observable<RoomType[]> {
    const url = [AppService.API, 'roomTypes'].join('/');
    return this.http.get<RoomType[]>(url);
  }

  listRent(): Observable<Rent[]> {
    const url = [AppService.API, 'rents'].join('/');
    return this.http.get<Rent[]>(url);
  }

  paginate(tableState: TableState): Promise<ServerResult> {
    sessionStorage.setItem(TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'rooms', 'paginate'].join('/');
    return this.http.post<any>(url, tableState).toPromise();
  }

  update(room: Room): Observable<Room> {
    const url = [AppService.API, 'rooms', room.id].join('/');
    return this.http.put<Room>(url, room);
  }

  updateRent(rent: Rent): Observable<Rent> {
    const url = [AppService.API, 'rents', rent.id].join('/');
    return this.http.put<Rent>(url, rent);
  }

  updateType(roomType: RoomType): Observable<RoomType> {
    const url = [AppService.API, 'roomTypes', roomType.id].join('/');
    return this.http.put<RoomType>(url, roomType);
  }

  getRent = (rents: Rent[], currency_code?: string): Rent => {
    const _filtered = _filter(rents, {currency_code: currency_code || 'MGA'});
    return _filtered.length > 0 ? new Rent(_filtered[0]) : null;
  };
}
