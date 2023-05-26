import BaseModel from './base-model';
import Room from './room';
import Tax from './tax';

export class Item extends BaseModel {
  id?: number;
  category_id?: number;
  bill_id?: number;
  company_id?: number;
  name?: string;
  item_type?: string;
  type?: string;
  description?: string;
  sale_price?: number;
  purchase_price?: number;
  quantity?: number;
  initial_quantity?: number;
  tax_id?: number;
  sku?: string;
  enabled?: boolean;
  attachments?: any[];
  Taxes?: Tax[];
  variations?: any[];
  ItemManufacturer: any;
  Itinerary: any;
  item_manufacturer_id: number;
  available?: ItemInventory; // for UI
  Inventories?: ItemInventory[];
}

export default Item;

export class ItemUnit extends BaseModel {
  id?: number;
  company_id?: number;
  name: string;
  description?: string;
  symbol?: string;
  meta?: {};
  enabled?: boolean;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  To?: Array<any>;
  From?: Array<any>;
}

export class ItemConversion extends BaseModel {
  conversion_factor: number;
  Item: Item;
  From: ItemUnit;
  To: ItemUnit;
}

export class ItemInventory extends BaseModel {
  Item?: Item;
  ItemUnit: ItemUnit;
  quantity: number;
  item_id?: number;
  unit_id?: number;
  storage_id?: number;
  InventoryStorage?: InventoryStorage
}

export class InventoryStorage extends BaseModel {
  id: number;
  name: string;
  enabled: boolean;
  type: string;
  description?: string;
  meta?: any;
  room_id?: number;
  Room?: Room;
}
export class ItemVariation extends BaseModel {
  doc_type: 'INVOICE' | 'BILL' | 'REQUEST';
  doc_id: number;
  name: string;
  item_id: number;
  unit_id?: number;
  quantity: number;
  item_type: string;
  status_code: string;
  created_at: string;

  ItemUnit?: ItemUnit;
}
