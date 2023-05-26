import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import * as moment from 'moment';
import {of, SmartTable} from 'smart-table-ng';
import {AppService} from 'src/app/app.service';
import {BillService} from 'src/app/expense/bill/bill.service';
import {SessionService} from 'src/app/_services/session.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {InventoryService} from '../../inventory.service';

import server from 'smart-table-server';
import {FilterOperator} from 'smart-table-filter';
import {UtilityService} from 'src/app/_services/utility.service';

const KEY = 'TS_SHIPPING';

@Component({
  selector: 'app-inventory-shipping',
  templateUrl: './inventory-shipping.component.html',
  styleUrls: ['./inventory-shipping.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: (billService: BillService, inventoryService: InventoryService) => of(
      [],
      inventoryService.getShippingConfig(KEY),
      server({
        query: (tableState) => billService.paginate(tableState, KEY).then((items: any) => {
          const filtered = items.data.filter(item => item.category_id === inventoryService.getDefaultBillTransferId());
          return {
            data: filtered,
            summary: {
              ...items.summary,
              filteredCount: filtered.length
            }
          }
        })
      })
    ),
    deps: [BillService, InventoryService]
  }]
})
export class InventoryShippingComponent implements OnInit {

  dateFormSubmitted = false;
  dateForm: FormGroup;

  constructor(public _table: SmartTable<any>,
    public appService: AppService,
    public utilityService: UtilityService,
    public smartTableService: SmartTableService,
    private formBuilder: FormBuilder,
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
        start: moment(this.dateForm.get('start').value).startOf('day').format(),
        end: moment(this.dateForm.get('end').value).endOf('day').format()
      };

      this._table.filter({
        due_at: [
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
      end: moment().toDate()
    });

    this.getSummary();
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: [moment().startOf('month').toDate(), Validators.required],
      end: [moment().toDate(), Validators.required]
    });

    this.sessionService.setDateForm(this.dateForm, KEY, 'due_at');
  }

}
