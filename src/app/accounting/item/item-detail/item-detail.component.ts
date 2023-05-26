import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';

import {ChartDataSets, ChartOptions} from 'chart.js';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment';
import _forEach from 'lodash.foreach';
import _orderBy from 'lodash.orderby';
import _groupBy from 'lodash.groupby';
import _sumBy from 'lodash.sumby';
import Item, {ItemUnit} from 'src/app/models/item';
import Category from 'src/app/models/category';
import Tax from 'src/app/models/tax';

import {AppService} from 'src/app/app.service';
import {CategoryService} from '../../category/category.service';
import {ExportService} from 'src/app/_services/export.service';
import {ItemService} from '../item.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {TaxService} from '../../tax/tax.service';

import {ContactPreviewComponent} from 'src/app/contact/contact-preview/contact-preview.component';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css']
})
export class ItemDetailComponent implements OnInit {
  form: FormGroup;
  categories: Category[];
  Item: Item;
  taxes: Observable<Tax[]>;
  units: Promise<ItemUnit[]>;

  startDate: Date;
  submitted: boolean;
  types: any[];

  doc_name;
  isChart = false;
  totalBill;
  totalInvoice;

  public lineChartData: ChartDataSets[];
  public lineChartLabels: string[];
  public lineChartOptions: ChartOptions;

  constructor(
    private categoryService: CategoryService,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private modalService: NgbModal,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private taxService: TaxService
  ) { }

  ngOnInit() {
    this.types = AppService.ITEM_TYPES;

    this.taxes = this.taxService.list();

    this.getCategories();
    this.initForm();

    setTimeout(() => {
      this.getItem();
    }, 500);
  }

  deleteAttachment(docId) {
    this.itemService.deleteAttachment(this.Item.id, docId)
      .then(() => {
        this.reset();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.message));
  }

  exportHistoryToExcel(histories) {
    const data = histories.map(item => {
      return {
        'DATE': moment(item.created_at).format('YYYY-MM-DD'),
        'NUM_FACTURE': item.invoice_id || item.bill_id,
        'ENTREE': item.hasOwnProperty('bill_id') ? item.quantity : null,
        'SORTIE': item.hasOwnProperty('invoice_id') ? item.quantity : null,
        'RESTE': item.on_hand
      };
    });

    this.exportService.exportToExcel(data, 'variations');
  }

  mapVariations(item: Item) {
    const variations = [];
    let before = 0;

    item.variations.forEach((elem, index) => {
      before = (index === 0) ? (this.Item.initial_quantity || 0) : variations[index - 1].on_hand;

      if (elem.hasOwnProperty('invoice_id') || elem.hasOwnProperty('request_id')) {
        if (elem.status_code === 'ADD') {
          elem.on_hand = before - elem.quantity;
        }
        else {  //  REMOVE
          elem.on_hand = before + elem.quantity;
          elem.quantity = -1 * elem.quantity;
        }
      }
      else {  //  bill_id
        if (elem.status_code === 'ADD') {
          elem.on_hand = before + elem.quantity;
        }
        else {  //  REMOVE
          elem.on_hand = before - elem.quantity;
          elem.quantity = -1 * elem.quantity;
        }
      }

      variations.push(elem);
    });

    item.variations = variations;

    this.totalInvoice = this.getTotal(variations, 'invoice_id') + this.getTotal(variations, 'request_id');
    this.totalBill = this.getTotal(variations, 'bill_id');
  }

  onDateSelect() {
    const start = moment(this.startDate).format('YYYY-MM-DD');

    this.itemService.variationV2(this.Item.id, {start: start})
      .toPromise()
      .then(res => {
        this.Item.variations = res;
        this.mapVariations(this.Item);
        this.initChart(res);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  onSelectCategory(event): void {
    event.preventDefault();

    this.form.patchValue({
      category_id: event.item.id,
      category_name: event.item.name
    });
  }

  previewDoc(idPhoto, type?: string) {
    if (idPhoto) {
      const modalRef = this.modalService.open(ContactPreviewComponent, {size: 'lg', windowClass: 'img-preview'});
      modalRef.componentInstance.idPhoto = idPhoto;
      modalRef.componentInstance.type = type ? type : 'documents';
    }
    else {
      this.notification.warning(null, 'FILE_NOT_FOUND');
    }
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const value = this.form.getRawValue();
      const item = new Item(
        Object.assign({}, value, {
          category_id: value.category.id,
          category_name: value.category.name,
          id: this.Item.id,
          type: this.form.get('type').value,
        })
      );

      this.itemService.update(item)
        .toPromise()
        .then(() => {
          this.reset();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initChart(variations) {
    const gpVariations = _groupBy(
      variations,
      elem => moment(elem.created_at).format('DD/MM/YYYY')
    );

    const invoiceData = [];
    const billData = [];

    _forEach(gpVariations, (value, key) => {
      billData.push(_sumBy(value, elem => elem.hasOwnProperty('bill_id') ? elem.quantity : 0));
      invoiceData.push(_sumBy(value, elem => elem.hasOwnProperty('bill_id') ? 0 : elem.quantity));
    });

    this.lineChartData = [
      {data: billData, label: 'Entrée'},
      {data: invoiceData, label: 'Sortie'}
    ];
    this.lineChartLabels = Object.keys(gpVariations);
    this.lineChartOptions = {
      responsive: true,
      scales: {
        // We use this empty structure as a placeholder for dynamic theming.
        xAxes: [{}],
        yAxes: [{
          ticks: {
            maxRotation: 90
          }
        }]
      }
    };
  }

  private getCategories() {
    this.categoryService.list({type: 'item'})
      .toPromise()
      .then(categories => {
        this.categories = categories;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getItem() {
    const id = this.route.snapshot.paramMap.get('id');

    this.submitted = false;
    this.startDate = moment().startOf('month').toDate();

    this.itemService.get(id)
      .toPromise()
      .then(res => {
        this.Item = new Item(res);
        this.form.patchValue(Object.assign({}, res, {
          category: this.categories.filter(item => item.id === res.category_id)[0],
          type: res.type
        }));

        this.onDateSelect();
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getTotal(variations, key) {
    return _sumBy(variations, item => {
      return item.hasOwnProperty(key) ? item.quantity : 0;
    });
  }

  private initForm() {
    this.submitted = false;
    this.form = this.formBuilder.group({
      name: [null, Validators.required],
      sku: [null, Validators.required],
      description: null,
      sale_price: [null, Validators.required],
      purchase_price: [null, Validators.required],
      quantity: 0,
      initial_quantity: null,
      type: null,
      tax_id: null,
      Taxes: null,
      unit: null,
      category: [null, Validators.required],
      enabled: true
    });
  }

  reset() {
    this.doc_name = null;
    this.Item = null;
    this.submitted = false;

    this.form.reset({
      quantity: 0,
      initial_quantity: null,
      enabled: true
    });

    this.getItem();
  }
}
