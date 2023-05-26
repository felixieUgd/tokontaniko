import {Injectable} from '@angular/core';
import * as fileSaver from 'file-saver';
import * as moment from 'moment';
import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {
  }

  public exportToExcel(json: any[], filename: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {Sheets: {'data': worksheet}, SheetNames: ['data']};
    const excelBuffer: any = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
    this.saveAsExcelFile(excelBuffer, filename);
  }

  public exportToJson(json: any, filename: string) {
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    fileSaver.saveAs(blob, filename.replace(/\s/g, '') + '_' + moment().format('DDMMYYYY') + '.json');
  }

  private saveAsExcelFile = (buffer: any, fileName: string): void => {
    const data: Blob = new Blob([buffer], {type: EXCEL_TYPE});
    fileSaver.saveAs(data, fileName + '_export_' + moment().format('YYYYMMDD_HHmm') + EXCEL_EXTENSION);
  };
}
