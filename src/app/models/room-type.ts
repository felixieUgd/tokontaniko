import Rent from './rent';

class RoomType {
  id?: number;
  company_id?: number;
  rent_id?: number;
  name?: string;
  description?: string;
  price?: number;
  code?: string;
  color?: string;
  guest_capacity_adult?: number;
  guest_capacity_children?: number;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  Rents?: Rent[];

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default RoomType;
