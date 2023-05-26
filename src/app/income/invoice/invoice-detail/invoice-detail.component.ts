import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators, FormArray} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';

import _map from 'lodash.map';
import _filter from 'lodash.filter';
import _forEach from 'lodash.foreach';
import _orderBy from 'lodash.orderby';
import * as moment from 'moment';

import Category from 'src/app/models/category';
import Invoice from 'src/app/models/invoice';
import Tax from 'src/app/models/tax';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmModalComponent} from 'src/app/ui-elements/modals/confirm-modal/confirm-modal.component';

import {AccountingService} from 'src/app/_services/accounting.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {ItemService} from 'src/app/accounting/item/item.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SessionService} from 'src/app/_services/session.service';
import {SharedService} from 'src/app/_services/shared.service';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import {UtilityService} from 'src/app/_services/utility.service';
import Item, {ItemUnit} from 'src/app/models/item';
import {InventoryService} from 'src/app/inventory/inventory.service';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';
import {AppendItemModalComponent} from 'src/app/ui-elements/modals/append-item-modal/append-item-modal.component';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css', '../../../../assets/scss/plugins/_datepicker.scss']
})
export class InvoiceDetailComponent implements OnInit, OnDestroy {
  historyForm: FormGroup;
  invoiceForm: FormGroup;
  invoice: Invoice;
  subscriptions = new Array<Subscription>();

  categories: Observable<Category[]>;
  taxes: Array<Tax>;
  items: Array<Item> = [];
  itemUnits: Array<ItemUnit> = []

  id;
  sidePanelOpen: boolean;
  searchItem;
  submitted;
  submitted_history;
  Total = {
    balance: 0,
    discount: 0,
    payment: 0,
    payment_due: 0,
    tax: 0,
    unpaid: 0
  };

  constructor(
    public utilityService: UtilityService,
    private accountingService: AccountingService,
    private categoryService: CategoryService,
    private inventoryService: InventoryService,
    private formBuilder: FormBuilder,
    private invoiceService: InvoiceService,
    private itemService: ItemService,
    private notification: NotificationService,
    private ngbModal: NgbModal,
    private printService: PrintService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private taxService: TaxService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.categories = this.categoryService.list({type: 'income'});

    this.onSubscribe();
    this.initHistoryForm();
    this.initTypeahead();
    this.initForm();
    this.getUnits();

    this.getTaxes();
    this.getInvoice(this.id);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  displayItems(item) {
    let description = '';

    if (item.status_code === 'CHECKIN' || item.status_code === 'CHECKOUT') {
      description = moment(item.description).format('DD MMM YYYY HH:mm');
    }
    else if (item.status_code === 'ADD' || item.status_code === 'REMOVE' || item.status_code === 'REMOVED') {
      const items = JSON.parse(item.description);

      for (let i = 0; i < items.length; i++) {
        description += items[i].name + ' (' + items[i].quantity + ')';

        if (items.length > 1 && (i + 1) < items.length) {
          description += ' - ';
        }
      }
    }
    else {
      description = item.description;
    }

    return description;
  }

  editItem(item: any) {
    const modal = this.ngbModal.open(AppendItemModalComponent, {
      size: 'md' as any
    });

    const component: AppendItemModalComponent = modal.componentInstance;

    component.items = this.items;
    component.type = 'INVOICE';
    component.hasTaxes = true;
    component.selected = item;
    modal.result.then(item => {
      this.updateIndividualItem(item);
    }).catch(() => {
      console.log('Dismissed');
    });
  }

  // Return total per item
  getTotal(formGroup: FormGroup) {
    const total = formGroup.controls.quantity.value * formGroup.controls.price.value;

    formGroup.patchValue({total: total});

    return total;
  }

  isNew = (item) => item.controls['state'] ? false : true;

  onSelectItem(event, group) {
    event.preventDefault();

    group.patchValue({
      item_id: event.item.id,
      item_type: event.item.type,
      name: event.item.name,
      sku: event.item.sku,
      price: event.item.sale_price
    });
  }

  openAppendModal() {
    const modal = this.ngbModal.open(AppendItemModalComponent, {
      size: 'md' as any
    });

    const component: AppendItemModalComponent = modal.componentInstance;

    component.type = 'INVOICE';
    component.hasTaxes = true;
    modal.result.then(item => {
      this.saveIndividualItem(item);
    }).catch(() => {
      console.log('Dismissed');
    });
  }

  openConfirm() {
    const modalRef = this.ngbModal.open(ConfirmModalComponent, {backdrop: 'static'});

    modalRef.componentInstance.title = 'Annuler la facture';
    modalRef.componentInstance.type = 'danger';
    modalRef.result
      .then(val => {
        if (val) {
          this.invoiceService.cancel(this.invoice)
            .toPromise()
            .then(res => {
              this.resetForm();
              this.notification.info(null, 'INVOICE_CANCELED');
            })
            .catch(err => this.notification.error(null, err.error));
        }
      })
      .catch(err => console.log('modal dismissed ! ', err));
  }

  openSidePanelPayment() {
    this.accountingService.facture.next(this.invoice);
    this.accountingService.sidePanelPayment.next(true);
  }

  print(type) {
    if (type === 'A4') {
      this.invoiceService.invoicePrint(this.invoice.id)
        .then(res => this.printService.invoice(this.invoice))
        .catch(err => {
          console.log(err);
          this.notification.error(null, err.error)
        });
    }
    else if (type === 'A4V2') {
      this.invoiceService.invoicePrint(this.invoice.id)
        .then(res => this.printService.invoiceV2(this.invoice))
        .catch(err => {
          console.log(err);
          this.notification.error(null, err.error)
        });
    }
    else if (type === 'RECEIPT') {
      if (this.invoice.status !== 'PAID') {
        this.notification.error(null, 'INVOICE_NOT_PAID');
      }
      else {
        this.invoiceService.invoicePrint(this.invoice.id)
          .then(res => this.printService.receipt(this.invoice))
          .catch(err => this.notification.error(null, err.error));
      }
    }
  }

  @Confirmable({title: 'Supprimer le produit'})
  removeItem(index: number, id: number) {
    if (this.InvoiceItems.at(index).get('item_type').value) {
      this.invoiceService.removeItem(this.invoice.id, id).toPromise().then(() => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      }).catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'DELETE_ERROR');
    }
  }

  save() {
    this.submitted = true;

    if (this.invoiceForm.valid) {
      const formValue = this.invoiceForm.getRawValue();
      const invoice = new Invoice(Object.assign({}, formValue, {
        category_id: formValue.category_id,
        id: this.invoice.id,
        contact_id: formValue.contact ? formValue.contact.id : null,
        contact_name: formValue.contact ? formValue.contact.name : null
      }));

      delete invoice.InvoiceItems;
      invoice['contact'] = undefined;

      this.invoiceService.updateInfo(invoice)
        .toPromise()
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  saveHistory() {
    this.submitted_history = true;

    if (this.historyForm.valid) {
      const params = {
        id: this.id,
        description: this.historyForm.get('description').value
      };

      this.invoiceService.addHistory(params)
        .toPromise()
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  sendEmail() {
    this.invoiceService.invoiceMail(this.invoice.id)
      .then(res => {
        this.notification.info(null, 'EMAIL_SENT');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  updateStatus(status) {
    this.invoiceService.updateStatus(this.invoice, {status: status})
        .toPromise()
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
  }

  get InvoiceItems(): FormArray {
    return this.invoiceForm.get('InvoiceItems') as FormArray;
  }

  private arrayToForm(invoiceItems) {
    invoiceItems.sort((a, b) => a.id - b.id);

    _forEach(invoiceItems, (item) => {
      this.InvoiceItems.push(
        this.formBuilder.group(
          Object.assign(
            {},
            item,
            {
              item,
              Taxes: [item.Taxes]
            }
          )
        )
      );
    });
  }


  private getInvoice(id) {
    this.invoiceService.get(id)
      .toPromise()
      .then(invoice => {
        this.invoice = invoice;
        this.invoice.Revenues = _orderBy(invoice.Revenues, ['id'], ['desc']);
        this.Total.discount = this.accountingService.getTotalDiscount(this.invoice.InvoiceItems);
        this.Total.payment = this.accountingService.getTotalPayment(this.invoice.Revenues);
        this.Total.payment_due = this.accountingService.getPaymentDue(this.invoice.InvoiceItems);
        this.Total.tax = this.accountingService.getTotalTax(this.invoice.InvoiceItems);
        this.Total.balance = this.Total.payment_due + this.Total.tax - this.Total.discount - this.Total.payment;

        setTimeout(() => {
          this.invoiceForm.patchValue(Object.assign({}, invoice, {
            contact: invoice.Contact,
            category_id: invoice.category_id,
            invoiced_at: new Date(invoice.invoiced_at),
            due_at: new Date(invoice.due_at)
          }));
          this.arrayToForm(invoice.InvoiceItems);
        }, 800);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getUnits() {
    this.inventoryService.getItemUnits().then(units => {
      this.itemUnits = units;
    }).catch(err => this.notification.error(null, err.error));
  }

  private getTaxes() {
    this.taxService.list().pipe(
      map(taxes => taxes.map(item => {
          item['disabled'] = true;
          return item;
        })
      )
    ).subscribe(value => this.taxes = value);
  }

  private initHistoryForm() {
    this.historyForm = this.formBuilder.group({
      description: ['', Validators.required]
    });
  }

  private initForm() {
    this.submitted = false;
    this.invoiceForm = this.formBuilder.group({
      invoiced_at: [null, Validators.required],
      invoice_number: [{value: '', disabled: true}],
      category_id: [null, Validators.required],
      due_at: [null, Validators.required],
      contact: [null, Validators.required],
      notes: null,
      InvoiceItems: this.formBuilder.array([])
    });
  }

  private initTypeahead() {
    this.searchItem = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => term.length < 3 ? [] : this.itemService.select(term))
      );
  }

  resetForm() {
    this.invoice = null;
    this.submitted_history = false;
    this.submitted = false;

    this.historyForm.reset();

    while(this.InvoiceItems.length) {
      this.InvoiceItems.removeAt(0);
    }

    this.invoiceForm.reset({invoice_number: {value: '', disabled: true}});
    this.getInvoice(this.id);
  }

  private onSubscribe() {
    this.subscriptions.push(
      this.sharedService.contact$.subscribe(contact => {
        if (contact) this.invoiceForm.patchValue({contact: contact});
      })
    );

    this.subscriptions.push(
      this.accountingService.sidePanelPayment.subscribe(value => {
        if (!value) this.resetForm();
      })
    );
  }

  private saveIndividualItem(item: any) {
    item = {
      ...item,
      invoice_id: this.invoice.id
    };

    delete item.item;
    delete item.units;

    this.invoiceService.addItem(this.invoice.id, item).toPromise().then(() => {
      this.resetForm();
      this.notification.success(null, 'SAVE_SUCCESS');
    }).catch(err => {
      console.log(err);
      this.notification.error(null, err.error);
    });
  }

  private updateIndividualItem(item: any) {
    this.invoiceService.updateItemWithUnit(this.invoice.id, item.id, item).toPromise().then(() => {
      this.resetForm();
      this.notification.success(null, 'UPDATE_SUCCESS');
    }).catch(err => {
      console.log(err);
      this.notification.error(null, err.error);
    });
  }
}
