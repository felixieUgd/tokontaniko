import Company from './company';
import Role from './role';
import Position from './position';
import BaseModel from './base-model';
import Contact from './contact';
import Geography from './geograhy';

class User extends BaseModel {
  id?: number;
  code?: string;
  name?: string;
  email?: string;
  password?: string;
  photo?: string;
  enabled?: boolean;
  last_logged_in_at?: string;
  Companies?: Company[];
  Geographies?: Geography[];
  Profile?: UserProfile;
  Roles?: Role[];
}

export class UserProfile extends BaseModel {
  address: string;
  attachments: Array<any>;
  audit: Array<any>;
  bio_dob: string;
  bio_nationality: string;
  bio_pob: string;
  contacts: Contact[];
  created_at: string;
  custom_fields: any;
  date_hire: string;
  date_termination: string;
  deleted_at: string;
  id: number;
  id_cin: string;
  id_driver_license: string;
  id_other: string;
  id_passport: string;
  marital_status: string;
  note: string;
  occupation: string;
  phone_primary: string;
  phone_work: string;
  position_id: number;
  salary: number;
  sex: string;
  tax_number: string;
  updated_at: string;
  user_id: number;
  website: string;
  Position: Position;
  ProfileEvents: UserProfileEvent[];
}

export class UserProfileEvent extends BaseModel {
  comment: string;
  created_at: string;
  event_date: string;
  score: number;
  type: 'NOTE' | 'OFFENSE' | 'CONTRIBUTION';
  User: User;
}

export default User;
