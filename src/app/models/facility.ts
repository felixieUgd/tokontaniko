import BaseModel from './base-model';
import Contact from './contact';
import Invoice from './invoice';
import Request from './request';

class Facility extends BaseModel {
  address: string;
  audit: any[];
  code: string;
  contact_id: number;
  facility_id: number;
  facility_type_id: number;
  geolocation_id: number;
  is_enabled: boolean;
  is_private: boolean;
  id: number;
  meta: any;
  name: string;
  attachments: any[];
  Contact: Contact;
  Contacts: any[];
  Claim: any;
  FacilityType: any;
  Geography: any;
  Invoices: Invoice[];
  Requests: Request[];
  StudentCount?: any[];
}

export default Facility;
