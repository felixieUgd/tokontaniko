import BaseModel from './base-model';

export class Income extends BaseModel {
  id?: number;
  company_id?: number;
  category_id?: number;
  amount?: number;
  currency_code?: string;
  currency_rate?: number;
  customer_id?: number;
  customer_tax_number?: string;
}

export default Income;
