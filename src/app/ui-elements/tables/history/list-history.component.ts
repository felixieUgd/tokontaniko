import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BillService} from 'src/app/expense/bill/bill.service';

import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';

import _orderBy from 'lodash.orderby';

@Component({
  selector: 'app-list-history',
  templateUrl: './list-history.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListHistoryComponent implements OnInit, OnChanges {
  @Input() dataId:number;
  @Input() dataTable:Array<any>;
  @Input() dataType:'INVOICE' | 'MAINTENANCE' | 'BILL';
  @Input() redirectLink:string;
  @Output() onSubmit = new EventEmitter<any>();

  form:FormGroup;
  sortedData: Array<any>;
  submitted:boolean;

  constructor(
    private billService:BillService,
    private formBuilder:FormBuilder,
    private invoiceService: InvoiceService,
    private maintenanceService:MaintenanceService,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.sortedData = _orderBy(changes.dataTable.currentValue,['created_at'] , ['desc']);
  }

  displayItems = (item) => {
    return this.maintenanceService.formatHistoryDescription(item);
  }

  saveHistory() {
    this.submitted = true;

    if (this.form.valid) {
      const params = Object.assign({}, this.form.value, {
        id: this.dataId
      });

      if (this.dataType === 'INVOICE') {
        this.invoiceService.addHistory(params)
          .toPromise()
          .then(res => {
            this.submitted = false;
            this.form.reset();
            this.onSubmit.emit();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else if (this.dataType === 'BILL') {
        this.billService.addHistory(params)
          .toPromise()
          .then(res => {
            this.submitted = false;
            this.form.reset();
            this.onSubmit.emit();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        this.maintenanceService.addHistory(params)
          .toPromise()
          .then(() => {
            this.submitted = false;
            this.form.reset();
            this.onSubmit.emit();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.submitted = false;
    this.form = this.formBuilder.group({
      description: [null, Validators.required]
    });
  }

  sortBy() {
    console.log(this.dataTable);
    return
  }
}
