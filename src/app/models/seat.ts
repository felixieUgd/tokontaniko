class Seat {
  id?: number;
  company_id?: number;
  reservation_id?: number;
  contact_id?: number;
  description?: string;
  invoice_item_id?: number;
  status?: number;
  label?: string;
  price?: number;
  meta?: any;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Seat;
