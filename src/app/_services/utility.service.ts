import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {formatCurrency} from '@angular/common';

import * as moment from 'moment';
import {MaskPipe} from 'ngx-mask';
import Invoice from '../models/invoice';
import _forEach from 'lodash.foreach';
import _sumBy from 'lodash.sumby';

import {AppService} from '../app.service';
import {NotificationService} from './notification.service';
import {SmartTable} from 'smart-table-ng';
import {FilterOperator} from 'smart-table-filter';
import {NgbDate} from '@ng-bootstrap/ng-bootstrap';
import {tap} from 'rxjs/operators';

import * as FileType from 'file-type';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor(
    private http: HttpClient,
    private mask: MaskPipe,
    private notification: NotificationService
  ) {
  }

  copyToClipboard(text:string) {
    if (window.navigator) {
      window.navigator['clipboard'].writeText(text)
        .then(() => this.notification.info(null, 'COPIED_TO_CLIPBOARD'))
        .catch(() => console.log('Copy error'));
    }
  }

  cleanUpSpecialChars(str: string) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  cleanUndefined(filters: any): void {
    _forEach(filters, (value, key) => {
      if (!value) delete filters[key];
    });
  }

  clearFilter(_table: SmartTable<any>, type: string | Array<any>) {
    let body = {};

    if (typeof type === 'string') {
      body[type] = undefined;
    }
    else {
      type.forEach(item => {
        body[item] = undefined;
      });
    }

    _table.filter(body);
  }

  clearSearch(_table: SmartTable<any>) {
    _table.search(undefined);
  }

  downloadFile(doc: any, docType: string = 'documents', suffix?: string) {
    const url = [AppService.API, 'static', docType, doc.doc_id].join('/');

    return this.http.get(url, {responseType: 'arraybuffer'}).pipe(
      tap(buffer => {
        const type = doc.doc_mime ? doc.doc_mime : FileType(new Uint8Array(buffer)).mime;
        const url = URL.createObjectURL(new Blob([buffer], {type}));
        const link = document.createElement('a');
        link.href = url;

        let name = doc.doc_name || ''

        if (suffix) {
          name += '_' + suffix;
        }

        if (name) {
          link.setAttribute('download', name);
        }

        link.setAttribute('target', 'blank');
        link.click();
        link.remove();
      })
    )

  }

  filterBy(_table: SmartTable<any>, type: string, value, operator: FilterOperator): void {
    const body = {};

    if (type) {
      body[type] = value ? [
        {
          value: value,
          operator: operator,
          type: typeof value === 'string' ? 'string' : 'number'
        }
      ] : undefined;

      _table.filter(body);
    }
  }

  getAge(str_dob) {
    return moment().diff(moment(str_dob), 'years', false);
  }

  getDuration(str_date_in: string, str_date_out: string): number {
    return Math.ceil(moment(str_date_out).diff(moment(str_date_in), 'days', true));
  }

  getImageUrl(docId: string, type: 'CONTACT' | 'LOGO' | 'USER' | 'STATIC', docType?: string) {
    let path = null;

    if (type === 'CONTACT') path = `contacts/${docId}/photo`;
    else if (type === 'USER') path = `users/${docId}/photo`;
    else if (type === 'STATIC')  path = `static/${docType}/${docId}`;
    else path = `public/logo/${docId}`;

    const fullPath = docId ? [AppService.API, path].join('/') : AppService.DEFAULT_LOGO;

    return fullPath;
  }

  getTextFromHtml(html: string) {
    html = html.replace(/<li>/g, '\u200B\t\u2022\u200B\t');
    html = html.replace(/<\/(p|div|h\d|ul|ol|br|li)>/g, '\n');
    html = html.replace(/<[^>]*>/g, '');
    return html;
  }

  getUploadUrl(id: any, type: 'CONTACT' | 'COMPANY' | 'USER' | 'ATTACHMENT', route?: string) {
    let path = null;

    if (type === 'CONTACT') path = `contacts/${id}/photo`;
    else if (type === 'COMPANY') path = `companies/${id}`;  //  logo or signature
    else if (type === 'USER') path = `users/${id}/photo`;
    else if (type === 'ATTACHMENT')  path = `${route}/${id}/attachment`;
    else path = null;

    const fullPath = [AppService.API, path].join('/');
    // console.log('[uploadUrl] ', fullPath);

    return fullPath;
  }

  getFilterValueId(filter: any, property: string) {
    if (!filter || !filter[property] || !filter[property].length)
      return null;

    return filter[property][0].value;
  }

  getInvoiceItemTotal(invoice: Invoice, itemType: 'SERVICES' | 'GOODS' | 'ASSET') {
    return _sumBy(invoice.InvoiceItems, item => item.item_type === itemType ? item.total : 0);
  }

  getLastHistoryDate(histories: any[]) {
    if (histories && histories.length > 0) {
      return histories[0].created_at;
    }
    return null;
  }

  getPaymentTotal(invoice: Invoice) {
    let total = 0;

    for (const revenue of invoice.Revenues) {
      total += revenue.amount;
    }

    return total;
  }

  getPhoto(photoId): Promise<any> {
    const headers = new HttpHeaders().set(
      'accept',
      'image / webp, image/*,*/ *; q = 0.8'
    );
    const _url = [AppService.API, 'static', 'logo', photoId].join('/');

    return this.http
      .get(_url, {headers, responseType: 'arraybuffer'})
      .toPromise();
  }

  importJSON(event: any, callbacks: { success: any, error?: any }) {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = () => {
      try {
        const parsed = JSON.parse(fileReader.result.toString());
        if (callbacks.success) {
          callbacks.success(parsed);
        }
      }
      catch(err) {
        console.log(err);

        if (callbacks.error) {
          callbacks.error('INVALID_FILE');
        }
      }
    }
    fileReader.onerror = (error) => {
      console.log(error);
      if (callbacks.error) {
        callbacks.error('IMPORT_ERROR');
      }
    }
  }

  ngbDateToMoment(date: NgbDate) {
    const cT = moment();

    cT.set({
      date: date.day,
      month: date.month - 1,
      year: date.year,
      hour: 12,
      minute: 0
    });

    return cT;
  }

  numberFormat(number): string {
    return this.mask.transform(number, 'separator');
  }

  phoneFormat(phone): string {
    return phone ? this.mask.transform(phone, '000 00 000 00') : '';
  }

  progressStyle(value): string {
    if (value < 25) return 'danger';
    else if (value >= 25 && value < 75) return 'warning';
    else return 'success';
  }

  roundDecimal(value, unit) {
    return Math.round((value + Number.EPSILON) * unit) / unit;
  }

  sendSMS(phones: string[], message: string) {
    const url = [AppService.API, 'job/text'].join('/');
    let normalized = this.cleanUpSpecialChars(this.getTextFromHtml(message.trim()));

    return this.http.post(url, {phones, message: normalized });
  }

  statusStyle(status) {
    const style = {
      color: 'white',
      background: 'danger',
      valuenow: 100,
      width: '100%'
    };

    switch (status) {
      case 'REJECTED':
      case 'CANCELED':
        style.background = 'default';
        style.color = 'dark';
        style.valuenow = 0;
        style.width = '0%';
        break;
      case 'VOIDED':
        style.background = 'default';
        style.color = 'dark';
        style.valuenow = 0;
        style.width = '0%';
        break;
      case 'REFUNDED':
        style.background = 'default';
        style.color = 'dark';
        style.valuenow = 0;
        style.width = '0%';
        break;
      case 'OPEN':
        style.background = 'primary';
        style.color = 'white';
        style.valuenow = 10;
        style.width = '10%';
        break;
      case 'SENT':
        style.background = 'danger';
        style.color = 'white';
        style.valuenow = 20;
        style.width = '20%';
        break;
      case 'APPROVED':
        style.background = 'danger';
        style.color = 'white';
        style.valuenow = 25;
        style.width = '25%';
        break;
      case 'IN_PROGRESS':
        style.background = 'info';
        style.color = 'white';
        style.valuenow = 50;
        style.width = '50%';
        break;
      case 'ON_HOLD':
        style.background = 'warning';
        style.color = 'dark';
        style.valuenow = 75;
        style.width = '75%';
        break;
      case 'PARTIAL':
        style.background = 'warning';
        style.color = 'dark';
        style.valuenow = 50;
        style.width = '50%';
        break;
      case 'PAID':
        style.background = 'success';
        style.color = 'white';
        style.valuenow = 100;
        style.width = '100%';
        break;
      case 'COMPLETED':
        style.background = 'success';
        style.color = 'white';
        style.valuenow = 100;
        style.width = '100%';
        break;
      default:  //  DRAFT
        style.background = 'danger';
        style.color = 'white';
        style.valuenow = 100;
        style.width = '100%';
        break;
    }

    return style;
  }

  exitFullscreen() {
    const doc = window.document;
    const cancelFullScreen = doc.exitFullscreen || doc['mozCancelFullScreen'] || doc['webkitExitFullscreen'] || doc['msExitFullscreen'];
    if (this.isDocumentFullscreen()) {
      return cancelFullScreen.call(doc);
    }
    else {
      return false;
    }
  }

  getCompanySetting(settings: Array<any>, key: string): {key: string, value: string} {
    for (let item of settings) if (item.key === ('general.' + key)) return item;
  }

  getIconByPresence(presence: number) {
    switch (presence) {
      case 1:
        return 'housekeeper.png';
      case 2:
        return 'director.png';
      case 3:
      case 19:
        return 'technician.png';
      case 4:
        return 'waitress.png';
      case 16:
        return 'guest.png';
      case 17:
        return 'guest_in.png';
      default:
        return 'ghost.png'
    }
  }

  isDocumentFullscreen() {
    const doc = window.document;
    return doc['fullscreenElement'] || doc['mozFullScreenElement'] || doc['webkitFullscreenElement'] || doc['msFullscreenElement'];
  }

  toggleFullscreen(element?: HTMLElement) {
    const doc = window.document;
    const docElt = element || doc.documentElement;

    const requestFullScreen = docElt.requestFullscreen || docElt['mozRequestFullScreen'] || docElt['webkitRequestFullScreen'] || docElt['msRequestFullscreen'];


    if (!this.isDocumentFullscreen()) {
      return requestFullScreen.call(docElt);
    }
    else {
      return this.exitFullscreen();
    }
  }

  public static formatCurrency(number, symbol?: string, currency_code?: string) {
    return formatCurrency(number, 'fr-FR', symbol || '', currency_code || 'MGA');
  }

  public static trimSpace(text: string): string {
    return text.replace(/\s/g, '');
  }

  public static strContains(text: string, compare: string): boolean {
    const str_text = text.toLowerCase();
    const str_compare = compare.toLowerCase();
    const regex = new RegExp(`${str_compare}`, 'g');

    return regex.test(str_text);
  }

  //  Retrouve le montant de départ après une remise par %
  public reversePercentageDecrease(value, percentage): number {
    return (value / (100 - percentage)) * 100;
  }

  //  Retrouve le montant de départ après une augmentation par %
  public reversePercentageIncrease(value, percentage): number {
    return (value / (100 + percentage)) * 100;
  }

  public round(value, unit): number {
    return Math.round(value / unit) * unit;
  }

  public roundUp(value, unit): number {
    return Math.ceil(value / unit) * unit;
  }
}

