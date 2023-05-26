import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';

import * as moment from 'moment';
import server from 'smart-table-server';
import {SmartTable, of} from 'smart-table-ng';
import {FilterConfiguration, FilterOperator} from 'smart-table-core';

import Transfer from 'src/app/models/transfer';

import {AppService} from 'src/app/app.service';
import {TransferService} from './transfer.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {ExportService} from 'src/app/_services/export.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (transferService: TransferService) => of(
      [],
      transferService.getConfig(),
      server({
        query: (tableState) => transferService.paginate(tableState).toPromise()
      })
    ),
    deps: [TransferService]
  }]
})
export class TransferComponent implements OnInit {
  @ViewChild('inputSearch') inputSearch: ElementRef<HTMLInputElement>;

  dateForm: FormGroup;
  subscription: Subscription;
  transfers: Transfer[];

  submitted: boolean;
  transferSummary: any;

  constructor(
    public appService: AppService,
    public smartTableService: SmartTableService,
    public _table: SmartTable<any>,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private transferService: TransferService,
    private utilityService: UtilityService
  ) {}

  ngOnInit() {
    this.initForm();

     this.subscription = this.transferService.sidePanelTransfer.subscribe(value => {
      if (!value) this._table.exec();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  exportToExcel(data, filename) {
    const mapped = data.map(item => {
      return {
        id: item.id,
        paid_at: moment(item.paid_at).format('YYYY-MM-DD'),
        category: item.Payment.Category.name,
        description: item.Payment.description,
        account_payment: item.Payment.Account.name,
        account_revenue: item.Revenue.Account.name,
        user: item.Payment.User.name,
        created_at: moment(item.created_at).format('YYYY-MM-DD HH:mm')
      };
    });

    this.exportService.exportToExcel(mapped, filename);
  }

  open = () => this.transferService.setSidePanelTransfer(true);

  resetForm() {
    this.submitted = false;
    this.inputSearch.nativeElement.value = null;

    this.dateForm.reset({
      start: moment().startOf('day').toDate(),
      end: moment().endOf('day').toDate()
    });
    this.utilityService.clearFilter(this._table, ['created_at', ['description']]);
  }

  search() {
    this.submitted = true;

    if (this.dateForm.valid) {
      const dateParams = this.dateForm.value;
      const params: FilterConfiguration = {
        created_at: [
          {
            value: moment(dateParams.start).startOf('day').format(),
            operator: FilterOperator.GREATER_THAN_OR_EQUAL,
            type: 'string'
          },
          {
            value: moment(dateParams.end).endOf('day').format(),
            operator: FilterOperator.LOWER_THAN_OR_EQUAL,
            type: 'string'
          }
        ]
      };
      this._table.filter(params);
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: [moment().startOf('day').toDate(), Validators.required],
      end: [moment().endOf('day').toDate(), Validators.required]
    });
  }

}
