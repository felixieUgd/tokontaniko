import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';

import * as moment from 'moment';
import _forEach from 'lodash.foreach';
import _orderBy from 'lodash.orderby';
import _groupBy from 'lodash.groupby';
import _sumBy from 'lodash.sumby';
import Item, {ItemUnit} from 'src/app/models/item';
import Category from 'src/app/models/category';
import Tax from 'src/app/models/tax';

import {AppService} from 'src/app/app.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {InventoryService} from 'src/app/inventory/inventory.service';

import {ContactPreviewComponent} from 'src/app/contact/contact-preview/contact-preview.component';
import {from, Observable} from 'rxjs';
import { CategoryService } from 'src/app/accounting/category/category.service';
import { ItemService } from 'src/app/accounting/item/item.service';
import { TaxService } from 'src/app/accounting/tax/tax.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ExportService} from 'src/app/_services/export.service';
import {TranslateService} from '@ngx-translate/core';
import {RoomService} from 'src/app/_services/room.service';
import Room from 'src/app/models/room';
import {map, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-inventory-detail',
  templateUrl: './inventory-detail.component.html',
  styleUrls: ['./inventory-detail.component.css']
})
export class InventoryDetailComponent implements OnInit {

  form: FormGroup;
  categories: Category[];
  Item: Item;
  taxes: Observable<Tax[]>;
  units: Promise<ItemUnit[]>;

  rooms: Room[] = [];

  startDate: Date;
  submitted: boolean;
  types: any[];

  doc_name;
  isChart = false;
  totalBill;
  totalInvoice;

  constructor(
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private inventoryService: InventoryService,
    private itemService: ItemService,
    private modalService: NgbModal,
    private translateService: TranslateService,
    private roomService: RoomService,
    private exportService: ExportService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private taxService: TaxService
  ) { }

  ngOnInit() {
    this.types = AppService.ITEM_TYPES;

    this.taxes = this.taxService.list();
    this.units = this.inventoryService.getItemUnits();

    this.initForm();
    this.setup();
  }

  deleteAttachment(docId) {
    this.itemService.deleteAttachment(this.Item.id, docId)
      .then(() => {
        this.reset();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.message));
  }

  exportExcel(variations: any[]) {
    const data = variations.map(variation => {
      return {
        'Document': this.translateService.instant('income.' + variation.type),
        'N°': this.getDocId(variation),
        'Source': variation.InventoryStorage && variation.InventoryStorage.Room ? variation.InventoryStorage.Room.title: '',
        'Destination': variation.Request && variation.Request.Room? variation.Request.Room.title: '',
        'Unité': variation.ItemUnit ? variation.ItemUnit.name: '',
        'Entrée': variation.type === 'BILL'? variation.quantity: null,
        'Sortie': variation.type !== 'BILL' ? variation.quantity : null,
        'Créé le': moment(variation.created_at).format('DD MMM YYYY HH:mm')
      };
    });

    this.exportService.exportToExcel(data, ['Historique', moment(this.startDate).format('MMYYYY'), this.Item.name.replace(/\s/g, '_')].join('_'));
  }

  getDocLink(variation: any) {
    if (!variation) return null;
    switch (variation.type) {
      case 'BILL':
        return '/inventory/entry/detail';
      case 'INVOICE':
        return '/income/invoice/detail';
      default:
        return '/inventory/out/detail';
    }
  }

  getDocId(variation: any) {
    if (!variation) return null;

    switch (variation.type) {
      case 'BILL':
        return variation.Bill.id;
      case 'INVOICE':
        return variation.Invoice.id;
      default:
        return variation.Request.id;
    }
  }

  onDateSelect() {
    const start = moment(this.startDate).format('YYYY-MM-DD');

    this.inventoryService.getVariationsByItem(this.Item.id, start)
      .toPromise()
      .then(res => {
        this.Item.variations = res.map(variation => {
          variation.InventoryStorage = variation.InventoryStorage? {...variation.InventoryStorage, Room: this.rooms.find(room => room.id === variation.InventoryStorage.room_id)}: null;

          return variation;
        });
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

  setItemUnit(event: ItemUnit) {
    if (event) {
      const body = {
        item_id: this.Item.id,
        unit_id: event.id
      };

      this.inventoryService.setUnit(body)
        .then(res => {
          this.reset();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
  }

  private setup() {
    this.categoryService.list({type: 'item'})
      .pipe(switchMap(categories => {
        return from(this.roomService.getRooms()).pipe(
          map(rooms => {
            this.rooms = rooms;

            return categories;
          })
        )
      }))
      .toPromise()
      .then(categories => {
        this.categories = categories;
        this.getItem();
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
