import Category from './category';
import Payment from './payment';
import Revenue from './revenue';
import User from './user';

class Transfer {
  id?: number;
  payment_account_id?: number;
  revenue_account_id?: number;
  amount?: number;
  paid_at?: string;
  description?: string;
  payment_method?: string;
  currency_code?: string;
  currency_rate?: number;
  category_id?: number;
  created_at?: string;
  deleted_at?: string;
  updated_at?: string;
  Category?: Category;
  Payment?: Payment;
  Revenue?: Revenue;
  User?: User;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Transfer;
