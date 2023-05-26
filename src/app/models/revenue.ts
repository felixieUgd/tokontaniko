import Account from './account';
import Category from './category';
import Contact from './contact';
import Income from './income';
import User from './user';

export class Revenue extends Income {
  account_id?: number;
  batch_id?: string;
  contact_id?: number;
  contact_name?: string;
  created_at: string;
  paid_at?: string;
  description?: string;
  is_transfer?: boolean;
  payment_method?: string;
  reference?: string;
  parent_id?: number;
  reconciled?: boolean;
  Account?: Account;
  Category?: Category;
  Contact?: Contact;
  User?: User;
}

export default Revenue;
