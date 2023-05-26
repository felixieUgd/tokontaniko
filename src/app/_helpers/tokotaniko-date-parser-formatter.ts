import {NgbDateParserFormatter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';

export class TokotanikoDateParserFormatter extends NgbDateParserFormatter {
  datePipe = new DatePipe('fr');

  /*constructor(private dateFormatString: string) {
    super();
  }*/

  format(date: NgbDateStruct): string {
    if (date === null) {
      return '';
    }

    try {
      return this.datePipe.transform(new Date(date.year, date.month - 1, date.day), 'mediumDate');
    }
    catch (e) {
      return '';
    }
  }

  parse(value: string): NgbDateStruct {
    if (!value) {
      return null;
    }

    try {
      const dateParts = this.datePipe.transform(value, 'M-d-y').split('-');
      return {year: parseInt(dateParts[2], 10), month: parseInt(dateParts[0], 10), day: parseInt(dateParts[1], 10)};
    }
    catch (e) {
      return null;
    }
  }
}
