import Room from './room';
import Invoice from './invoice';
import Contact from './contact';
import Request from './request';
import User from './user';

export class Reservation {
  id?: number;
  check_in?: string;
  check_out?: string;
  date_in?: string;
  date_out?: string;
  num_guest_adult?: number;
  num_guest_children?: number;
  channel?: string;
  contact_id?: number;
  contact_name?: string;
  notes?: string;
  travel_from?: string;
  travel_to?: string;
  status?: string;
  user_id?: number;
  created_at?: string;
  guests?: Contact[];
  Requests?: Request[];
  Rooms?: Room[];
  User?: User;
  Contact?: Contact;
  Invoice?: Invoice;
  Unpaid?: Reservation[];

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Reservation;
