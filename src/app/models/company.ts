class Company {
  id?: number;
  company_id?: number;
  name?: string;
  domain?: string;
  email?: string;
  currency_code?: string;
  address?: string;
  enabled?: boolean;
  Settings?: any;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Company;
