import {Injectable} from '@angular/core';
import {DisplayedItem, TableState} from 'smart-table-core';

export interface Summary {
  page: number;
  size: number;
  filteredCount: number;
}

export interface ServerResult {
  data: DisplayedItem<any>[];
  summary: Summary;
}

@Injectable({
  providedIn: 'root'
})
export class SmartTableService {

  constructor() {
  }

  slice(table, pager) {
    table.slice({
      page: pager.page,
      size: pager.size
    });
  }

}
