import Currency from './currency';
import RoomType from './room-type';

class Rent {
  id?: number;
  company_id?: number;
  currency_id?: number;
  room_type_id?: number;
  name?: string;
  start?: string;
  end?: string;
  price?: number;
  description?: string;
  is_discounted?: boolean;
  enabled?: boolean;
  currency_code?: string;
  currency_rate?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  Currency?: Currency;
  RoomType?: RoomType;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Rent;
