import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import * as moment from 'moment';
import sumBy from 'lodash.sumby';

import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {BillService} from 'src/app/expense/bill/bill.service';

@Component({
  selector: 'app-income-statement',
  templateUrl: './income-statement.component.html',
  styleUrls: ['./income-statement.component.css', '../../../assets/scss/plugins/_datepicker.scss']
})
export class IncomeStatementComponent implements OnInit {
  dateForm: FormGroup;

  summary: any;
  submitted: boolean;

  codes = [
    'C_70', 'C_71', 'C_72', 'C_74', 'C_75', 'C_60', 'C_61', 'C_62', 'C_63',
    'C_64', 'C_65', 'C_66', 'C_67', 'C_68', 'C_76', 'C_77', 'C_603', 'C_692', 'C_693', 'C_695', 'C_781', 'C_786'
  ];
  summaryByCategory = [];

  constructor(private formBuilder: FormBuilder,
              private billService: BillService,
              private printService: PrintService,
              private notification: NotificationService) {}

  ngOnInit() {
    this.initForm();
    this.search();
  }

  checkAnomaly(data: any[], index: number): boolean {
    if (index !== 0) {
      const currentEl = moment(data[index].start);
      const prevEl = moment(data[index - 1].end);

      return currentEl.isBefore(prevEl);
    }

    return false;
  }

  groupBy(code) {
    return sumBy(this.summary.filter(elem => elem.Category.code.toString().startsWith(code.toString())), 'total');
  }

  parse(jsonString) {
    return jsonString ? JSON.parse(jsonString) : {};
  }

  print() {
    this.printService.incomeStatement(this.dateForm.getRawValue(), this.summary);
  }

  resetForm() {
    this.submitted = false;
    this.dateForm.reset({
      start: moment().startOf('month').toDate(),
      end: moment().endOf('month').toDate()
    });
  }

  search() {
    this.submitted = true;

    if (this.dateForm.valid) {
      const params = this.dateForm.value;

      //  TODO: API CALL
      this.billService.reportSummary('category', params)
        .then(res => {
          this.summaryByCategory = res;

          const data = {};

          for (const item of this.codes) {
            const filtered = res.filter(elem => ('C_' + elem.Category.code).toString().startsWith(item));

            if (filtered.length > 0) {
              data[item] = sumBy(filtered, 'total');
            }
            else {
              data[item] = null;
            }
          }

          const one = data['C_70'] + data['C_71'] + data['C_72'];
          const two = data['C_60'] + data['C_603'] + data['C_61'] + data['C_62'];
          const four = data['C_74'] + data['C_64'] + data['C_63'];
          const five = data['C_75'] + data['C_65'] + data['C_68'] + data['C_781'];
          const six = data['C_76'] + data['C_66'] + data['C_786'];
          const eight = this.sumByClass(7) - this.sumByClass(6);
          const nine = data['C_77'] + data['C_67'];

          this.summary = Object.assign({}, data, {
            one,
            two,
            three: one - two,
            four,
            five,
            six,
            seven: five - six,
            eight,
            nine,
            ten: eight + nine,
            class_7: this.sumByClass(7),
            class_6: this.sumByClass(6)
          });
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  sumByClass(categoryClass) {
    const sum = sumBy(this.summaryByCategory
      .filter(elem => elem.Category.code.toString().startsWith(categoryClass.toString()))
      , 'total');

    return sum > 0 ? sum : null;
  }

  total(array) {
    return sumBy(array, 'total');
  }

  private initForm() {
    this.submitted = false;
    this.dateForm = this.formBuilder.group({
      start: [moment().startOf('month').toDate(), Validators.required],
      end: [moment().endOf('month').toDate(), Validators.required]
    });
  }
}
