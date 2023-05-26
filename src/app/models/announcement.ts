import BaseModel from './base-model';
import User from './user';

class Announcement extends BaseModel {
  audit: any[];
  company_id: number;
  content: string;
  created_at: string;
  deleted_at: string;
  expiration_date: string;
  id: number;
  is_signature_required: boolean;
  locations: any;
  permissions: any[];
  priority: number;
  signatures: [];
  title: string;
  updated_at: string;
  user_id: number;
  User: User;
}

export default Announcement;
