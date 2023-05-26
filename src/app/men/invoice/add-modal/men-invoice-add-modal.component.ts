import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import _map from 'lodash.map';
import Category from 'src/app/models/category';
import Request from 'src/app/models/request';

import {AppService} from 'src/app/app.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {ItemService} from 'src/app/accounting/item/item.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {SharedService} from 'src/app/_services/shared.service';
import { SettingsCompanyService } from 'src/app/settings/company/settings-company.service';


@Component({
  selector: 'app-invoice-add',
  templateUrl: './men-invoice-add-modal.component.html',
  styleUrls: ['./men-invoice-add-modal.component.css', '../../../../assets/scss/plugins/_datepicker.scss'],
  providers: []
})
export class MenInvoiceAddModalComponent implements OnInit, OnDestroy {
  data: Request;

  addInvoiceForm: FormGroup;
  subscription = new Subscription();
  categories: Category[];

  submitted: boolean;

  category: Category;

  school_year: string;

  constructor(
    public activeModal: NgbActiveModal,
    private appService: AppService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    public invoiceService: InvoiceService,
    private itemService: ItemService,
    private notification: NotificationService,
    private sessionService: SessionService,
    private settingsCompanyService: SettingsCompanyService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.initForm();
    this.getCategories();
    
    this.subscription.add(
      this.sharedService.contact$.subscribe(contact => {
        if (contact) {
          this.addInvoiceForm.patchValue({
            contact_id: contact.id,
            contact_name: contact.name,
            contact_phone: contact.phone
          });
        }
      })
    );

    const insuranceId = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_insurance_item');

    if (insuranceId && !isNaN(insuranceId)) {
      const company_id = this.sessionService.getCompanyId();
      this.itemService.get(insuranceId).toPromise().then(item => {
        this.addItem(this.formBuilder.group({
          company_id: company_id,
          description: null,
          id: null,
          item_id: [item.id, Validators.required],
          item_type: item.type,
          name: [item.name, Validators.required],
          quantity: [0, Validators.required],
          price: [item.sale_price, [Validators.required, Validators.min(1)]],
          total: 0,
          sku: item.sku,
          meta: null
        }))
      }).catch(err => this.notification.error(null, err.error));
    }
    else {
      this.addItem();
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addItem(fg?: FormGroup) {
    const company_id = this.sessionService.getCompanyId();

    if (!fg) {
      fg = this.formBuilder.group({
        company_id: company_id,
        description: null,
        id: null,
        item_id: [null, Validators.required],
        item_type: 'GOODS',
        name: [null, Validators.required],
        quantity: [1, Validators.required],
        price: [0, [Validators.required, Validators.min(1)]],
        total: 0,
        sku: null,
        meta: null
      });
    }

    this.subscription.add(
      fg.valueChanges.subscribe(() => {
        this.getTotal(fg);
      })
    )

    this.InvoiceItems.push(fg);
  }

  getBalance() {
    const items = this.InvoiceItems.value;

    return this.invoiceService.getPaymentDue(items);
  }

  getTotal(formGroup: FormGroup) {
    const total = formGroup.controls.quantity.value * formGroup.controls.price.value;

    formGroup.patchValue({total: total}, {emitEvent: false});

    return total;
  }

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

  removeItem(index) {
    this.InvoiceItems.removeAt(index);
  }

  save() {
    this.submitted = true;

    if (this.addInvoiceForm.valid) {
      const formValue = this.addInvoiceForm.getRawValue();

      const body = Object.assign(
        {},
        formValue,
        {
          amount: this.getBalance(),
          category_id: this.category? this.category.id: null,
          category_name: this.category? this.category.name: null,
          contact_id: formValue.contact.id,
          contact_name: formValue.contact.name,
          contact_phone: formValue.contact.phone,
          meta: {
            school_year: formValue.school_year,
            insurance_number: formValue.insurance_number,
            Students: '[]'
          }
        }
      );

      if (this.data) {
        body.request_id = this.data.id;
        body.notes = this.data.Invoices.length ? ('Additive ' + this.data.Invoices.length): '';
      }

      this.invoiceService.create(body)
        .toPromise()
        .then(res => {
          this.activeModal.close(res);
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
      switchMap(term => term.length < 3 ? [] : this.itemService.select(term))
    )

  get InvoiceItems(): FormArray {
    return this.addInvoiceForm.get('InvoiceItems') as FormArray;
  }

  private getCategories() {
    const settings = JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
    if (settings && !isNaN(+settings['default_invoice_category'])) {
        this.categoryService.get(+settings['default_invoice_category'])
        .toPromise()
        .then(category => {
          this.category = category;
        })
        .catch(err => this.notification.error(null, err.error));
      }
    else {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }
  }

  private initForm() {

    if (this.data && this.data.RequestType) {
      const arr = /(\d*)\s*-\s*(\d*)/g.exec(this.data.RequestType.name);
      if (arr[0]) {
        this.school_year = arr[0];
      }
    }

    this.addInvoiceForm = this.formBuilder.group({
      contact: [null, Validators.required],
      currency_code: ['MGA', Validators.required],
      currency_rate: 1,
      invoiced_at: [new Date(), Validators.required],
      due_at: [new Date(), Validators.required],
      invoice_number: this.appService.getInvoiceCode(),
      order_number: null,
      school_year: [this.school_year || null, Validators.required],
      invoice_status_code: 'draft',
      InvoiceItems: this.formBuilder.array([])
    });
  }

}

