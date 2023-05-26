import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import * as moment from 'moment';

const prefix = 'NOTE-';
@Injectable({
  providedIn: 'root'
})
export class SidePanelNoteService {

  sidePanel = new BehaviorSubject<boolean>(false);

  constructor() {
    localStorage.removeItem(prefix + moment().subtract(3, 'days').format('YYYY-MM-DD'));
  }

  get defaultKey() {
    return moment().format('YYYY-MM-DD');
  }

  getNote = (key?: string) => {
    key = key || this.defaultKey;
    return localStorage.getItem(prefix + key);
  }

  setNote = (value: string, key?: string) => {
    key = key || this.defaultKey;
    return localStorage.setItem(prefix + key, value);
  }
}
