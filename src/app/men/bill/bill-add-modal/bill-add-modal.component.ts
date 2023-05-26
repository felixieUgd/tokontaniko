import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {BillService} from 'src/app/expense/bill/bill.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {ItemService} from 'src/app/accounting/item/item.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';

import Category from 'src/app/models/category';
import Request from 'src/app/models/request';
import Tax from 'src/app/models/tax';

import {AppService} from 'src/app/app.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import {MenContactType, MenService} from 'src/app/men/men.service';
import Contact from 'src/app/models/contact';
import {SharedService} from 'src/app/_services/shared.service';

@Component({
  selector: 'app-add-bill-modal',
  templateUrl: './bill-add-modal.component.html',
  styleUrls: ['./bill-add-modal.component.css', '../../../../assets/scss/plugins/_datepicker.scss']
})
export class BillAddModalComponent implements OnInit {
  data:Request;

  addBillForm: FormGroup;
  subscription: Subscription;
  categories: Category[] = [];
  contacts: Contact[];
  taxes: Tax[];

  submitted: boolean;

  constructor(
    public activeModal: NgbActiveModal,
    public invoiceService: InvoiceService,
    private appService: AppService,
    private billService: BillService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private menService: MenService,
    private notification: NotificationService,
    private sessionService: SessionService,
    private sharedService: SharedService,
    private taxService: TaxService
  ) {}

  ngOnInit() {
    this.contacts = this.menService.getWarrants(this.data.Contacts, MenContactType.WARRANT);

    this.initForm();
    this.getCategories();
    this.getTaxes();
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
      item_type: 'SERVICES',
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      total: 0,
      sku: null,
      meta: null,
      Taxes: null
    });

    this.BillItems.push(fg);
  }

  clearIfZero(formControl: FormControl) {
    if (formControl && +formControl.value === 0) {
      formControl.setValue(null);
    }
  }

  getBalance() {
    const items = this.BillItems.value;

    return this.invoiceService.getPaymentDue(items) + this.invoiceService.getTotalTax(items) - this.invoiceService.getTotalDiscount(items);
  }

  getTotal(formGroup: FormGroup) {
    const total = formGroup.controls.quantity.value * formGroup.controls.price.value;

    formGroup.patchValue({total: total});

    return total;
  }

  onSelectItem = (event, group): void => {
    event.preventDefault();

    if (event.item) {
      group.patchValue({
        item_id: event.item.id,
        item_type: event.item.type,
        name: event.item.name,
        sku: event.item.sku,
        price: event.item.purchase_price,
        Taxes: event.item.Taxes
      });
    }
    else {
      this.sharedService.updateSidePanelItem(true);
    }
  }

  removeItem(index) {
    this.BillItems.removeAt(index);
  }

  save() {
    this.submitted = true;

    if (this.addBillForm.valid) {
      const formValue = this.addBillForm.value;

      const body = Object.assign(
        {},
        formValue,
        {
          contact_id: formValue.contact.id,
          contact_name: formValue.contact.name,
          contact_phone: formValue.contact.phone,
          amount: this.invoiceService.getPaymentDue(this.BillItems.value),
          category_id: formValue.category.id,
          category_name: formValue.category.name
        }
      );

      if (this.data) body.request_id = this.data.id;

      this.billService.create(body)
        .toPromise()
        .then(res => {
          this.activeModal.close(res);
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
      switchMap(term => term.length < 3 ?
          []
          : this.itemService.select(term).toPromise().then(res => {
            return res && res.length? res: [null];
          }).catch(err => {
            this.notification.error(null, err.error);
            return [null];
          })
        )
    );

  get BillItems(): FormArray {
    return this.addBillForm.get('BillItems') as FormArray;
  }

  private getCategories() {
    this.categoryService.list({type: 'expense'})
      .toPromise()
      .then(categories => {
        this.categories = categories;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getTaxes() {
    this.taxService.list()
      .toPromise()
      .then(res => {
        this.taxes = res;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.addBillForm = this.formBuilder.group({
      category: [null, Validators.required],
      contact: [this.data.meta.Accident.Warrant, Validators.required],
      currency_code: ['MGA', Validators.required],
      currency_rate: 1,
      billed_at: [new Date(), Validators.required],
      due_at: [new Date(), Validators.required],
      bill_number: [this.appService.getBillCode(), Validators.required],
      order_number: null,
      notes: null,
      bill_status_code: 'draft',
      BillItems: this.formBuilder.array([])
    });

    this.addItem();
  }

}
