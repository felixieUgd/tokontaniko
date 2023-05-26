import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {BillSummaryComponent} from './bill/bill-summary.component';
import {ExpenseSummaryComponent} from './expense/expense-summary.component';

import * as moment from 'moment';

import {ExpenseService} from '../expense.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss']
})
export class SummaryComponent implements OnInit {
  dateForm: FormGroup;

  dateFormSubmitted: boolean;
  loading: boolean;

  billSummary;
  expenseSummary;
  paymentSummary;
  summary = {};

  @ViewChild(ExpenseSummaryComponent) private expenseSummaryComponent: ExpenseSummaryComponent;
  @ViewChild(BillSummaryComponent) private billSummaryComponent: BillSummaryComponent;

  constructor(
    private expenseService: ExpenseService,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadSummary();
  }

  loadSummary(params?: any) {
    this.loading = true;

    this.expenseService.summary(params)
      .toPromise()
      .then(summary => this.summary = summary)
      .catch(err => this.notification.error(null, err.error))
      .finally(() => this.loading = false);
  }

  reset() {
    this.dateFormSubmitted = false;
    this.dateForm.reset({
      start: moment().startOf('day').toDate(),
      end: moment().endOf('day').toDate()
    });

    this.submit();
  }

  submit() {
    this.dateFormSubmitted = true;

    if (this.dateForm.valid) {
      const params = {
        start: moment(this.dateForm.get('start').value).startOf('day').format(),
        end: moment(this.dateForm.get('end').value).endOf('day').format()
      };

      this.loadSummary(params);
      this.expenseSummaryComponent.fetchExpenses(params);
      this.billSummaryComponent.fetchBills(params);
    }
  }

  private initForm() {
    // const sessionDates = null || this.sessionService.getDatesFromSession(ExpenseService.TS_KEY, 'paid_at');

    this.dateForm = this.formBuilder.group({
      start: [
        moment().startOf('day').toDate(),
        Validators.required
      ],
      end: [
        moment().endOf('day').toDate(),
        Validators.required
      ]
    });

    this.sessionService.setDateForm(this.dateForm, ExpenseService.TS_KEY, 'paid_at');
  }
}
