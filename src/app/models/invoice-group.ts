import Category from './category';
import Contact from './contact';
import Invoice from './invoice';

export class InvoiceGroup {

  amount: null;
  audit: [];
  id: number;
  company_id: number;
  invoice_group_number: string;
  invoiced_at: string;
  due_at: string;
  contact_id: number;
  contact_name: string;
  created_at: string;
  meta: any;
  status: string;
  updated_at: string;
  deleted_at: string;
  Category: Category;
  Contact?: Contact;
  Invoices: Invoice[];

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default InvoiceGroup;
