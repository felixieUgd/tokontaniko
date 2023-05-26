import BaseModel from './base-model'

export class PaymentMethod extends BaseModel {
  code?: string;
  name?: string;
  order?: number;
  description?: string;
}
