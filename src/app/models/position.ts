class Position {
  audit?: any[];
  created_at?: string;
  custom_fields?: any[];
  deleted_at?: string;
  description?: string;
  id?: number;
  max_salary?: string;
  min_salary?: string;
  paid_leaves?: number;
  title?: string;
  updated_at?: string;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Position;
