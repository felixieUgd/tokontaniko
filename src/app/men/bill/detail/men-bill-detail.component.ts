import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import { AccountService } from 'src/app/accounting/account/account.service';
import { CategoryService } from 'src/app/accounting/category/category.service';
import { ItemService } from 'src/app/accounting/item/item.service';
import { AppService } from 'src/app/app.service';
import { BillService } from 'src/app/expense/bill/bill.service';
import Account from 'src/app/models/account';
import Bill from 'src/app/models/bill';
import Category from 'src/app/models/category';
import { TokotanikoDateParserFormatter } from 'src/app/_helpers/tokotaniko-date-parser-formatter';
import { AccountingService } from 'src/app/_services/accounting.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { SessionService } from 'src/app/_services/session.service';
import { SharedService } from 'src/app/_services/shared.service';
import { UtilityService } from 'src/app/_services/utility.service';

@Component({
  selector: 'app-men-bill-detail',
  templateUrl: './men-bill-detail.component.html',
  styleUrls: ['./men-bill-detail.component.css', '../../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: TokotanikoDateParserFormatter}]
})
export class MenBillDetailComponent implements OnInit, OnDestroy {
  bill: Bill;
  billForm: FormGroup;
  paymentForm: FormGroup;
  subscription: Subscription;
  accounts: Account[];
  categories: Observable<Category[]>;

  id: number;
  sidePanelOpen: boolean;
  submitted: boolean;
  submitted_payment: boolean;

  paymentMethods;
  searchItem;
  total_payment = 0;
  Total = {
    balance: 0,
    discount: 0,
    payment: 0,
    payment_due: 0,
    tax: 0,
    unpaid: 0
  };

  constructor(
    public appService: AppService,
    public utilityService: UtilityService,
    private accountService: AccountService,
    private accountingService: AccountingService,
    private billService: BillService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.id = +this.route.snapshot.paramMap.get('id');
    this.submitted = false;
    this.submitted_payment = false;
    this.paymentMethods = this.appService.paymentMethods;
    this.categories = this.categoryService.list({type: 'expense'});

    this.getAccounts();
    this.getBill(this.id);

    this.initBillForm();
    this.initPaymentForm();
    this.initTypeahead();

    this.subscription = this.sharedService.contact$.subscribe(contact => {
      if (contact) {
        this.billForm.patchValue({
          contact_id: contact.id,
          contact_name: contact.name
        });

        this.bill.Contact.email = contact.email;
        this.bill.Contact.phone = contact.phone;
      }
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
      bill_id: this.bill.id,
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      total: 0,
      sku: null,
      meta: null,
      state: 'NEW',
      tax: 0,
      Taxes: null
    });

    this.BillItems.push(fg);
  }

  addPayment() {
    this.submitted_payment = true;

    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.getRawValue();
      const payment = Object.assign({}, formValue, {
        bill_id: this.id,
        payment_method: formValue.payment_method.code,
        account_id: formValue.account.id,
        category_id: this.bill.category_id,
        contact_name: this.bill.contact_name,
        currency_rate: 1,
        currency_code: 'MGA',
        type: 'BILL_PAYMENT'
      });

      this.billService.createPayment(this.id, payment)
        .toPromise()
        .then(res => {
          this.closePaymentForm();
          this.resetForm();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  cancel() {
    this.billService.cancel(this.bill)
      .toPromise()
      .then(res => {
        this.resetForm();
        this.notification.info(null, 'BILL_CANCELED');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  clearIfZero(formControl: FormControl) {
    if (formControl && +formControl.value === 0) {
      formControl.setValue(null);
    }
  }

  closePaymentForm() {
    this.sidePanelOpen = false;
    this.submitted_payment = false;

    this.paymentForm.reset();
  }

  displayItems(item) {
    let description = '';

    if (item.status_code === 'ADD' || item.status_code === 'REMOVE' || item.status_code === 'REMOVED') {
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

  // Return total per item
  getItemTotal = (formGroup: FormGroup) => {
    return this.accountingService.getItemTotal(formGroup);
  }

  isNew = (item) => item.controls['state'] ? false : true;

  openPaymentForm() {
    this.paymentForm.reset();
    this.paymentForm.patchValue({
      paid_at: new Date(),
      amount: this.Total.balance
    });
    this.sidePanelOpen = true;
  }

  removeItem(index) {
    this.BillItems.removeAt(index);
  }

  onSelectItem = (event, item) => {
    event.preventDefault();

    if (event.item) {
      item.patchValue({
        item_id: event.item.id,
        item_type: event.item.type,
        name: event.item.name,
        sku: event.item.sku,
        price: event.item.purchase_price
      });
    }
    else {
      this.sharedService.sidePanelItem.next(true);
    }
  }

  onSelectPaymentMethod(event): void {
    event.preventDefault();

    this.paymentForm.patchValue({
      payment_method: event.item.code,
      payment_method_name: event.item.name
    });
  }

  updateBill(): void {
    this.submitted = true;

    if (this.billForm.valid) {
      const formValue = this.billForm.getRawValue();
      const bill = new Bill(Object.assign({}, this.bill, {
        category_id: formValue.category.id,
        category_name: formValue.category.id,
        contact_id: this.bill.contact_id,
        contact_name: this.bill.contact_name,
        due_at: formValue.due_at,
        BillItems: formValue.BillItems
      }));

      this.billService.update(bill)
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

  updateStatus() {
    this.billService.updateStatus(this.bill, {status: 'RECEIVED'})
      .toPromise()
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  get BillItems(): FormArray {
    return this.billForm.get('BillItems') as FormArray;
  }

  private arrayToForm(array): void {
    for (let i = 0; i < array.length; i++) {
      const item = Object.assign({}, {description: null}, array[i])

      this.BillItems.push(
        this.formBuilder.group(item)
      );
    }
  }

  private getAccounts() {
    this.accountService.list()
      .toPromise()
      .then(res => {
        this.accounts = res;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getBill(id: number) {
    this.submitted = false;
    this.billService.get(id)
      .toPromise()
      .then(bill => {
        this.bill = bill;
        this.Total.payment = this.accountingService.getTotalPayment(bill.Payments);
        this.Total.payment_due = this.accountingService.getPaymentDue(bill.BillItems);
        this.Total.balance = this.Total.payment_due - this.Total.payment;

        setTimeout(() => {
          this.billForm.patchValue(Object.assign({}, bill, {
            contact: bill.Contact,
            category: bill.Category,
            billed_at: new Date(bill.billed_at),
            due_at: new Date(bill.due_at)
          }));
        });

        this.arrayToForm(bill.BillItems);
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private initBillForm() {
    this.submitted = false;
    this.billForm = this.formBuilder.group({
      billed_at: null,
      bill_number: null,
      due_at: [null, Validators.required],
      category: [null, Validators.required],
      contact: [null, Validators.required],
      BillItems: this.formBuilder.array([])
    });
  }

  private initPaymentForm() {
    this.paymentForm = this.formBuilder.group({
      description: [''],
      paid_at: [null, Validators.required],
      amount: ['', Validators.required],
      account: ['', Validators.required],
      payment_method: [null, Validators.required]
    });
  }

  private initTypeahead() {
    this.searchItem = (text$: Observable<string>) =>
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
  }

  private resetForm() {
    this.bill = null;

    this.billForm.reset();
    while(this.BillItems.length) {
      this.BillItems.removeAt(0);
    }
    
    this.getBill(this.id);
  }
}
