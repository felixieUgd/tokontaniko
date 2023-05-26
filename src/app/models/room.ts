import Tax from './tax';
import RoomType from './room-type';
import Reservation from './reservation';
import Request from './request';
import Facility from './facility';

class Room {
  id?: number;
  company_id?: number;
  tax_id?: number;
  room_type_id?: number;
  facility_id?: number;
  description?: string;
  guest_capacity_adult?: number;
  guest_capacity_children?: number;
  title?: string;
  price?: number;
  for_rent?: boolean;
  is_available?: boolean;
  enabled?: boolean;
  active?: boolean;
  Tax?: Tax;
  RoomType?: RoomType;
  Histories?: any[];
  Requests?: Request[];
  Facility?: Facility;
  Reservations?: Reservation[]

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Room;
