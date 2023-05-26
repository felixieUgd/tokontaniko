import Expense from './expense';
import Contact from './contact';
import Category from './category';
import Request from './request';
import BaseModel from './base-model';
import {InvoiceItem} from './invoice';

export class Bill extends BaseModel {
  id?: number;
  company_id?: number;
  bill_number: string;
  order_number?: string;
  bill_status_code: string;
  billed_at: string;
  due_at?: string;
  amount?: number;
  currency_code: string;
  currency_rate?: number;
  contact_id?: number;
  contact_name?: string;
  contact_email?: string;
  contact_tax_number?: string;
  contact_phone?: string;
  contact_address?: string;
  notes?: string;
  status: string;
  request_id?: number;
  category_id: number;
  parent_id?: number;
  Request?: Request;
  BillItems?: InvoiceItem[];
  Payments?: Expense[];
  BillHistories?: any[];
  Category?: Category;
  Contact?: Contact;
  attachments?: any[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export default Bill;

export interface BillItem extends InvoiceItem {}
