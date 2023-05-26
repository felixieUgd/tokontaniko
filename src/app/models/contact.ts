import Revenue from './revenue';
import Bill from './bill';
import Payment from './payment';
import Reward from './reward';
import Tax from './tax';
import BaseModel from './base-model';
import Account from './account';

class Contact extends BaseModel {
  address?: string;
  attachments?: any[];
  bio_dob?: string | Date;
  bio_nationality?: string;
  bio_pob?: string;
  code?: string;
  company_id?: string;
  created_at?: string;
  currency_code?: string;
  deleted_at?: string;
  doc_cin?: string;
  doc_driver_license?: string;
  doc_other?: string;
  doc_passport?: string;
  email?: string;
  enabled?: boolean;
  id?: number;
  id_cin?: string;
  id_driver_license?: string;
  id_other?: string;
  id_passport?: string;
  is_business?: boolean;
  parent_id?: number;
  points_accumulated?: number;
  meta?: any;
  name?: string;
  note?: string;
  occupation?: string;
  phone?: string;
  photo?: string;
  reference?: string;
  sex?: string;
  status?: string;
  tax_number?: string;
  updated_at?: string;
  user_id?: number;
  verification_code?: string;
  verification_expiration?: string;
  verified?: boolean;
  website?: number;
  Accounts?: Array<Account>;
  Bills?: Bill[];
  Parent?: Contact;
  Payments?: Payment[];
  RequestContacts?: any;
  Revenues?: Revenue[];
  Reward?: Reward;
  Taxes?: Tax[];
}

export default Contact;

export class ContactOverview extends BaseModel {
  Taxes?: Tax[];
  code?: string;
  email?: string;
  id?: number;
  name?: string;
  phone?: string;
}
