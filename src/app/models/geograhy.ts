import BaseModel from './base-model';

class Geography extends BaseModel {
  id: number;
  name: string;
  type: 'RGN' | 'DST' | 'CMN';
  parent_id?: number;

  meta?: any[] | {
    shape_id?: number;
    delivery_time?: number;
  };
}

export default Geography;
