import Income from './income';
import User from './user';

export class InvoicePayment extends Income {
  invoice_id?: number;
  account_id?: number;
  paid_at?: string;
  description?: string;
  payment_method?: string;
  reference?: string;
  reconciled?: boolean;
  user_id?: number;
}

export default InvoicePayment;
