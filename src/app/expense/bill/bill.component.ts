import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import * as moment from 'moment';
import {of, SmartTable} from 'smart-table-ng';
import server from 'smart-table-server';
import {FilterOperator} from 'smart-table-core';

import Bill from '../../models/bill';

import {AppService} from 'src/app/app.service';
import {BillService} from './bill.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (billService: BillService) => of(
      [],
      billService.getConfig(),
      server({
        query: (tableState) => billService.paginate(tableState)
      })
    ),
    deps: [BillService]
  }]
})
export class BillComponent implements OnInit {
  drafts: Bill[] = [];
  dateFormSubmitted = false;
  dateForm: FormGroup;

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              public smartTableService: SmartTableService,
              private billService: BillService,
              private formBuilder: FormBuilder,
              private notification: NotificationService,
              private sessionService: SessionService) {
  }

  ngOnInit() {
    this.initForm();
    this.getSummary();
  }

  getSummary() {
    this.dateFormSubmitted = true;

    if (this.dateForm.valid) {
      const params = {
        start: moment(this.dateForm.get('start').value).format(),
        end: moment(this.dateForm.get('end').value).format()
      };

      this.billService.drafts(params)
        .then(drafts => {
          this.drafts = drafts;
        })
        .catch(err => this.notification.error(null, err.error));

      this._table.filter({
        billed_at: [
          {
            value: params.start,
            operator: FilterOperator.GREATER_THAN_OR_EQUAL,
            type: 'string'
          },
          {
            value: params.end,
            operator: FilterOperator.LOWER_THAN_OR_EQUAL,
            type: 'string'
          }
        ]
      });
    }
  }

  resetForm() {
    this.dateFormSubmitted = false;
    this.dateForm.reset({
      start: moment().startOf('month').toDate(),
      end: moment().endOf('day').toDate()
    });

    this.getSummary();
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: [moment().startOf('month').toDate(), Validators.required],
      end: [moment().endOf('day').toDate(), Validators.required]
    });

    this.sessionService.setDateForm(this.dateForm, BillService.TS_KEY, 'billed_at');
  }
}
