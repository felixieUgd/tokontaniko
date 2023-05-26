import Income from './income';
import Contact from './contact';
import Category from './category';
import User from './user';
import InvoiceGroup from './invoice-group';
import Reservation from './reservation';
import Facility from './facility';
import Request from './request';
import BaseModel from './base-model';
import Tax from './tax';
import { ItemUnit } from './item';

export class Invoice extends Income {
  created_at?: string;
  request_id?: number;
  parent_id?: string;
  contact_id?: number;
  facility_id?: number;
  invoice_group_id?: number;
  invoice_number?: string;
  order_number?: string;
  invoice_status_code?: string;
  invoiced_at?: string;
  due_at?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  meta?: any;
  notes?: string;
  status?: string;
  subtotal?: number;
  balance?: number;
  Category?: Category;
  Contact?: Contact;
  Request?: Request;
  Facility?: Facility;
  InvoiceGroup?: InvoiceGroup;
  InvoiceHistories?: Array<any>;
  InvoiceItems?: Array<any>;
  Revenues?: Array<any>;
  User?: User;
}

export default Invoice;

export interface InvoiceItem {
  company_id?: number;
  description?: string;
  id?: number;
  item_id?: number;
  unit_id?: number;
  item_type?: string;
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
  sku?: string;
  meta?: any;
  storage_id?: number;
  ItemUnit?: ItemUnit;
  Taxes?: Tax[];
}
