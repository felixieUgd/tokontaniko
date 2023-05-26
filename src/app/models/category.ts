class Category {
  id?: number;
  company_id?: number;
  code?: number;
  name?: string;
  type?: string;
  color?: string;
  enabled?: boolean;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Category;
