import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';

import ItemVariation from 'src/app/models/item';

import * as moment from 'moment';
import _forEach from 'lodash.foreach';
import _groupBy from 'lodash.groupby';
import _orderBy from 'lodash.orderby';
import _sumBy from 'lodash.sumby';
import server from 'smart-table-server';
import {SmartTable, of} from 'smart-table-ng';
import {FilterOperator} from 'smart-table-core';

import {AppService} from 'src/app/app.service';
import {ExportService} from '../../_services/export.service';
import {ItemService} from './item.service';
import {NotificationService} from '../../_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {SharedService} from 'src/app/_services/shared.service';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (itemService: ItemService) => of(
      [],
      itemService.getConfig(),
      server({
        query: (tableState) => itemService.paginate(tableState)
      })
    ),
    deps: [ItemService]
  }]
})
export class ItemComponent implements OnInit, OnDestroy {
  reportForm: FormGroup;
  subscription: Subscription;
  variations: ItemVariation[];

  submitted: boolean;
  types: any[];

  selectedFilter;

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private notification: NotificationService,
    private printService: PrintService,
    private sharedService: SharedService,
    public smartTableService: SmartTableService
  ) {}

  ngOnInit() {
    const session: any = sessionStorage.getItem(ItemService.TS_KEY);
    const parsed = JSON.parse(session);
    this.selectedFilter = parsed && parsed.filter.hasOwnProperty('type') ?
        parsed.filter.type[0].value : 'GOODS';

    this.types = AppService.ITEM_TYPES;

    this.initForm();
    this.filterByType(this.selectedFilter);

    this.subscription = this.sharedService.sidePanelItem.subscribe((value:any) => {
      if (!value) this.reset();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  downloadReport() {
    if (!this.variations || !this.variations.length) {
      this.notification.error(null, 'NO_RECORD');
    }
    else {
      const formValue = this.reportForm.value;
      const filename = [
        'variations',
        moment(formValue.start).format('DDMMYY'),
        moment(formValue.end).format('DDMMYY')
      ].join('_');

      this.exportService.exportToExcel(this.variations, filename);
    }
  }

  getVariations() {
    this.submitted = true;

    if (this.reportForm.valid) {
      const formValue = this.reportForm.value;
      const body = {
        start: moment(formValue.start).startOf('day').format(),
        end: moment(formValue.end).endOf('day').format(),
        item_type: formValue.item_type
      };

      this.itemService.getVariations(body)
        .then(res => this.variations = _orderBy(res, ['doc_type', 'created_at'], ['asc', 'desc']))
        .catch(err => this.notification.error(null, err.error));
    }
    else this.notification.error(null, 'FORM_NOT_VALID');
  }

  filterByType(type) {
    this._table.filter({
      type: [{
        value: type,
        operator: FilterOperator.EQUALS,
        type: 'string'
      }]
    });
  }

  report(type) {
    const params = {type: this.selectedFilter};

    this.itemService.list(params)
      .toPromise()
      .then(res => {
        if (type === 'XLS') {
          this.exportService.exportToExcel(res, 'inventory');
        }
        else {  //  PDF
          this.printService.closing(
            _orderBy(res, ['id'], ['asc'])
          );
        }
      })
      .catch(err => this.notification.error(null, err.error));
  }

  open() {
    this.sharedService.updateSidePanelItem(true);
  }

  reset() {
    this.variations = [];

    this.reportForm.reset({
      start: this.appService.getDateStartOf('month').toDate(),
      end: this.appService.getDateEndOf('day').toDate(),
      item_type: null
    });

    this._table.exec();
  }

  private initForm() {
    this.submitted = false;

    this.reportForm = this.formBuilder.group({
      start: [
        this.appService.getDateStartOf('month').toDate(),
        Validators.required
      ],
      end: [
        this.appService.getDateEndOf('day').toDate(),
        Validators.required
      ],
      item_type: [null, Validators.required]
    });
  }
}
