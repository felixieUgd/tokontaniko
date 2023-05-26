import {Component, OnInit, ViewChild} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import * as moment from 'moment';

import {RevenueSummaryComponent} from './revenue/revenue-summary.component';
import {InvoiceSummaryComponent} from './invoice/invoice-summary.component';

import {IncomeService} from '../income.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';

@Component({
  selector: 'app-income-summary',
  templateUrl: './income-summary.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss']
})
export class IncomeSummaryComponent implements OnInit {
  @ViewChild(RevenueSummaryComponent) private revenueSummaryComponent: RevenueSummaryComponent;
  @ViewChild(InvoiceSummaryComponent) private invoiceSummaryComponent: InvoiceSummaryComponent;

  invoiceSummary;
  revenueSummary;
  dateForm: FormGroup;

  dateFormSubmitted: boolean;
  loading: boolean;
  summary:any = {};

  constructor(private formBuilder: FormBuilder,
              private incomeService: IncomeService,
              private notification: NotificationService,
              private sessionService: SessionService) {
  }

  ngOnInit() {
    this.initForm();
    this.loadSummary();
  }

  loadSummary(params?: any) {
    this.loading = true;

    this.incomeService.summary(params)
      .toPromise()
      .then(summary => this.summary = summary)
      .catch(err => this.notification.error(null, err.error))
      .finally(() => this.loading = false);
  }

  resetForm() {
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
        start: moment(this.dateForm.controls.start.value).startOf('day').format(),
        end: moment(this.dateForm.controls.end.value).endOf('day').format()
      };

      this.loadSummary(params);
      this.revenueSummaryComponent.fetchRevenues(params);
      this.invoiceSummaryComponent.fetchInvoices(params);
    }
  }

  private initForm() {
    // const sessionDates = null || this.sessionService.getDatesFromSession(IncomeService.TS_KEY, 'paid_at');

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

    this.sessionService.setDateForm(this.dateForm, IncomeService.TS_KEY, 'paid_at');
  }
}
