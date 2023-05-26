import {Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, Subject, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';

import {NgbTypeahead} from '@ng-bootstrap/ng-bootstrap';

import {BillService} from 'src/app/expense/bill/bill.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {SharedService} from 'src/app/_services/shared.service';
import {AppService} from 'src/app/app.service';
import {InventoryService} from '../inventory.service';

import _orderBy from 'lodash.orderby';
import Bill from 'src/app/models/bill';
import Category from 'src/app/models/category';
import Item, {ItemInventory} from 'src/app/models/item';

@Component({
  selector: 'app-inventory-entry',
  templateUrl: './inventory-entry.component.html',
  styleUrls: ['./inventory-entry.component.css', '../../../assets/scss/plugins/_datepicker.scss']
})
export class InventoryEntryComponent implements OnInit, OnDestroy {
  addBillForm: FormGroup;
  subscription = new Subscription();
  categories: Category[] = [];
  itemFGs: FormGroup[] = [];
  items: Item[] = [];

  requestId: number;

  submitted: boolean;

  defaultRoomId: number;

  amount: number;
  vendorConfig;

  @ViewChild('categoryTypeahead') categoryTypeahead: NgbTypeahead;

  clickCategory$ = new Subject<string>();

  constructor(
    private appService: AppService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private billService: BillService,
    private categoryService: CategoryService,
    private notification: NotificationService,
    private sessionService: SessionService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.route.params.subscribe(params => {
        if (params) {
          this.requestId = params['orderId']? +params['orderId']: null;
        }
      })
    );

    this.initForm();
    this.getCategories();

    this.defaultRoomId = this.inventoryService.getDefaultRoomId();
    if (!this.defaultRoomId) {
      this.notification.error(null, 'DEFAULT_ROOM_NOT_FOUND');
    }
    else {
      this.inventoryService.getInventoryByRoom(this.defaultRoomId, this.items).then(
        inventories => {
          if (this.items) {
            this.items = [...this.items];
          }
          else {
            this.notification.error(null, 'ITEMS_NOT_SET');
          }
        }
      ).catch(err => this.notification.error(null, err.error));
    }


    this.subscription.add(
      this.sharedService.contact$.subscribe(contact => {
        if (contact) this.addBillForm.patchValue({contact});
      })
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addItem() {
    const company_id = this.sessionService.getCompanyId();

    const fg = this.formBuilder.group({
      company_id: company_id,
      description: null,
      item_id: 0,
      item_type: 'GOODS',
      item: [null, Validators.required],
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      total: 0,
      storage_id: [null, Validators.required],
      unit_id: [null, Validators.required],
      sku: null,
      meta: null,
      units: null
    });

    this.BillItems.push(fg);
  }

  getPaymentDue() {
    this.amount = 0;
    const items = this.addBillForm.controls['BillItems'].value;

    for (let i = 0; i < items.length; i++) {
      this.amount += items[i]['quantity'] * items[i]['price'];
    }

    return this.amount;
  }

  getTotal(formGroup: FormGroup) {
    const total = formGroup.controls.quantity.value * formGroup.controls.price.value;

    formGroup.patchValue({total: total});

    return total;
  }

  onSelectItem = (event, group): void => {
    if (event && event.id) {
      group.patchValue({
        item_id: event.id,
        item_type: event.type || 'GOODS',
        name: event.name,
        price: event.sale_price || 0,
        units: event.Inventories.map((inventory: ItemInventory) => {
          return {
            id: inventory.unit_id,
            name: inventory.ItemUnit.name,
            storage_id: inventory.InventoryStorage ? inventory.InventoryStorage.id : null,
            remainingQuantity: inventory.quantity
          }
        }),
        total: 0
      });
    }
    else {
      group.patchValue({
        item: null,
        item_id: null,
        item_type: null,
        units: null,
        unit_id: null,
        price: 0,
        name: null,
        storage_id: null
      });
    }
  }

  onSelectUnit = (event, group): void => {
    group.patchValue({
      unit_id: event ? event.id : null,
      storage_id: event ? event.storage_id : null
    });
  }

  removeItem(index) {
    this.BillItems.removeAt(index);
  }

  save() {
    this.submitted = true;

    if (this.addBillForm.valid) {
      const formValue = this.addBillForm.value;
      if (formValue.BillItems) {
        formValue.BillItems.forEach(billItem => {
          delete billItem.item;
          delete billItem.units;
        });
      }

      const bill = new Bill(
        Object.assign(
          {},
          formValue,
          {
            request_id: this.requestId,
            contact_id: formValue.contact.id,
            contact_name: formValue.contact.name,
            contact_phone: formValue.contact.phone,
            amount: this.getPaymentDue(),
            category_id: formValue.category.id,
            category_name: formValue.category.name
          }
        )
      );

      this.billService.createWithUnit(bill)
        .then(res => {
          this.router.navigate(['/inventory/entry/detail/', res.id]);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  searchItem = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) return [];
        else return this.selectItem(term);
      })
    );

  get BillItems(): FormArray {
    return this.addBillForm.get('BillItems') as FormArray;
  }

  private getCategories() {
    this.categoryService.list({type: 'expense'})
      .toPromise()
      .then(categories => this.categories = categories)
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.addBillForm = this.formBuilder.group({
      category: [null, Validators.required],
      contact: [null, Validators.required],
      currency_code: ['MGA', Validators.required],
      currency_rate: 1,
      billed_at: [new Date(), Validators.required],
      due_at: [new Date(), Validators.required],
      bill_number: [
        this.appService.getBillCode(), Validators.required
      ],
      order_number: null,
      notes: null,
      request_id: null,
      bill_status_code: 'draft',
      BillItems: this.formBuilder.array([])
    });

    this.addItem();
  }

  private selectItem(term) {
    return this.inventoryService.select(term)
      .toPromise()
      .then(res => {
        return res.length > 0 ? res : [null];
      })
      .catch(err => this.notification.error(null, err.error));
  }
}
