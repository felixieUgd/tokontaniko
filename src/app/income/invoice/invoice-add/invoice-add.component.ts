import {Component, OnInit, ViewChild, Output, EventEmitter, Input, OnDestroy} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, Subject, merge, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap, filter, map} from 'rxjs/operators';
import {Router} from '@angular/router';

import _map from 'lodash.map';

import Category from 'src/app/models/category';
import Invoice from 'src/app/models/invoice';
import Tax from 'src/app/models/tax';

import {AppService} from 'src/app/app.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {ContactService} from 'src/app/contact/contact.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {ItemService} from 'src/app/accounting/item/item.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import {SessionService} from 'src/app/_services/session.service';
import {SharedService} from 'src/app/_services/shared.service';

import {NgbTypeahead} from '@ng-bootstrap/ng-bootstrap';
import Contact from 'src/app/models/contact';
import {environment} from 'src/environments/environment';
import Item, {ItemInventory} from 'src/app/models/item';
import {InventoryService} from 'src/app/inventory/inventory.service';

const API_BOX = environment.apiBox;

@Component({
  selector: 'app-invoice-add',
  templateUrl: './invoice-add.component.html',
  styleUrls: ['./invoice-add.component.css', '../../../../assets/scss/plugins/_datepicker.scss'],
  providers: []
})
export class InvoiceAddComponent implements OnInit, OnDestroy {
  @ViewChild('categoryTypeahead') categoryTypeahead: NgbTypeahead;
  clickCategory$ = new Subject<string>();

  @Input() formValue = new EventEmitter<Contact>();
  @Output() sidePanel = new EventEmitter<any>();

  addInvoiceForm: FormGroup;
  subscription: Subscription;
  categories: Observable<Category[]>;
  taxes: Observable<Tax[]>;
  items: Item[] = [];

  submitted;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private appService: AppService,
    private sessionService: SessionService,
    private itemService: ItemService,
    private invoiceService: InvoiceService,
    private taxService: TaxService,
    private notification: NotificationService,
    private inventoryService: InventoryService,
    private contactService: ContactService,
    private categoryService: CategoryService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.categories = this.categoryService.list({type: 'income'});
    this.taxes = this.taxService.list();

    // this.eventHandler();
    this.initForm();
    this.inventoryService.getInventoryByDefaultRoom(this.items).then(
      inventories => {
        if (this.items) {
          this.items = [...this.items];
        }
        else {
          this.notification.error(null, 'ITEMS_NOT_SET');
        }
      }
    ).catch(err => this.notification.error(null, err.error));

    this.subscription = this.sharedService.contact$.subscribe(contact => {
      if (contact) this.addInvoiceForm.patchValue({contact});
    });
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
      storage_id: [null, Validators.required],
      unit_id: null,
      quantity: [1, Validators.required],
      units: null,
      price: [0, [Validators.required, Validators.min(1)]],
      total: 0,
      sku: null,
      meta: null,
      Taxes: null
    });

    this.InvoiceItems.push(fg);
  }

  getBalance() {
    return this.getPaymentDue() + this.getTotalTax();
  }

  getPaymentDue() {
    const items = this.addInvoiceForm.controls['InvoiceItems'].value;
    let amount = 0;

    for (let i = 0; i < items.length; i++) {
      amount += items[i]['quantity'] * items[i]['price'];
    }

    return amount;
  }

  getTotal(formGroup: FormGroup) {
    const total = formGroup.controls.quantity.value * formGroup.controls.price.value;

    formGroup.patchValue({total: total});

    return total;
  }

  getTotalDiscount(): number {
    const invoiceItems = this.addInvoiceForm.value.InvoiceItems;

    return this.invoiceService.getTotalDiscount(invoiceItems);
  }

  getTotalTax(): number {
    const invoiceItems = this.addInvoiceForm.value.InvoiceItems;

    return this.invoiceService.getTotalTax(invoiceItems);
  }

  onSelectContact = (event): void => {
    event.preventDefault();

    if (event.item) {
      this.addInvoiceForm.patchValue({
        contact_id: event.item.id,
        contact_name: event.item.name,
        contact_phone: event.item.phone
      });
    }
    else {
      const contact_name = this.addInvoiceForm.get('contact_name').value;

      this.sharedService.newContact({name: contact_name});
      this.sharedService.updateSidePanel(true);
    }
  }

  onSelectItem = (event, group): void => {
    let clear = true;
    if (event && event.id) {
      if (event.type === 'SERVICES' || (event.available && event.available.quantity)) {
        clear = false;
        group.patchValue({
          item_id: event.id,
          item_type: event.type || 'GOODS',
          name: event.name,
          price: event.sale_price,
          units: event.Inventories.map((inventory: ItemInventory) => {
            return {
              id: inventory.unit_id,
              name: inventory.ItemUnit.name,
              storage_id: inventory.InventoryStorage ? inventory.InventoryStorage.id : null,
              remainingQuantity: inventory.quantity
            }
          }),
          unit_id: event.unit_id,
          total: 0
        });
      }
      else {
        this.notification.error(null, 'ITEM_OUT_OF_STOCK');
      }
    }
    
    if (clear) {
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
    this.InvoiceItems.removeAt(index);
  }

  save() {
    this.submitted = true;

    if (this.addInvoiceForm.valid) {
      const formValue = this.addInvoiceForm.getRawValue();

      if (formValue.InvoiceItems) {
        formValue.InvoiceItems.forEach(invItem => {
          delete invItem.item;
          delete invItem.units;
        });
      }

      const invoice = new Invoice(
        Object.assign(
          {},
          formValue,
          {
            amount: this.getBalance(),
            contact_id: formValue.contact.id,
            contact_name: formValue.contact.name,
            category_id: formValue.category.id,
            category_name: formValue.category.name
          }
        )
      );

      this.invoiceService.createWithUnit(invoice)
        .then(res => {
          this.router.navigate(['/income/invoice/detail/', res.id]);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
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
    )

  get InvoiceItems(): FormArray {
    return this.addInvoiceForm.get('InvoiceItems') as FormArray;
  }

  private eventHandler() {
    const ctrl = this;
    const source = new EventSource(API_BOX);

    source.addEventListener('message', event => {
      if (event['data'] !== '{}') {
        const keyword = event['data'].replace(/"/g, '').trim();

        ctrl.contactService.find(keyword)
          .toPromise()
          .then(res => {
            if (res) {
              this.addInvoiceForm.patchValue({
                contact_id: res.id,
                contact_name: res.name,
                contact_phone: res.phone
              });
            }
            else {
              this.addInvoiceForm.patchValue({
                contact_name: keyword
              });
            }
          })
          .catch(err => ctrl.notification.error(null, err.error));
      }
    }, false);

    source.addEventListener('error', err => {
      console.log('Error: ', err);
    });
  }

  private initForm() {
    this.addInvoiceForm = this.formBuilder.group({
      contact: [null, Validators.required],
      category: [null, Validators.required],
      currency_code: ['MGA', Validators.required],
      currency_rate: 1,
      invoiced_at: [new Date(), Validators.required],
      due_at: [new Date(), Validators.required],
      invoice_number: this.appService.getInvoiceCode(),
      order_number: null,
      notes: null,
      invoice_status_code: 'draft',
      InvoiceItems: this.formBuilder.array([])
    });

    this.addItem();
  }

  private selectItem(term) {
    return this.itemService.select(term)
      .toPromise()
      .then(res => {
        return res.length > 0 ? res : [null];
      })
      .catch(err => this.notification.error(null, err.error));
  }
}

