import Account from './account';
import Bill from './bill';
import Category from './category';
import Contact from './contact';
import Item from './item';
import User from './user';

export default interface Expense {
  id?: number;
  type: string;
  bill_id?: number;
  company_id: number;
  category_id: number;
  account_id: number;
  contact_id?: number;
  contact_name: string;
  paid_at: string;
  amount: number;
  currency_code: string;
  currency_rate: number;
  description: string;
  payment_method: string;
  reference?: string;
  parent_id?: string;
  reconciled?: string;
  Bill?: Bill[];
  Account?: Account;
  Category?: Category;
  Contact?: Contact;
  Items?: Item[];
  User?: User;
}

