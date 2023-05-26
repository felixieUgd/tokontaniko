import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';

import Bill from '../../../models/bill';
import Category from 'src/app/models/category';
import Account from 'src/app/models/account';

import {AppService} from '../../../app.service';
import {NotificationService} from '../../../_services/notification.service';
import {AccountService} from 'src/app/accounting/account/account.service';
import {CategoryService} from '../../../accounting/category/category.service';
import {PrintService} from 'src/app/_services/print.service';
import {SharedService} from 'src/app/_services/shared.service';
import {SessionService} from 'src/app/_services/session.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {AccountingService} from 'src/app/_services/accounting.service';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import Item, {InventoryStorage, ItemInventory, ItemUnit} from 'src/app/models/item';
import {BillService} from 'src/app/expense/bill/bill.service';
import {InventoryService} from '../../inventory.service';
import {SettingsStructureStorageService} from 'src/app/settings/structure/storage/settings-structure-storage.service';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {AppendItemModalComponent} from 'src/app/ui-elements/modals/append-item-modal/append-item-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';

@Component({
  selector: 'app-inventory-entry-detail',
  templateUrl: './inventory-entry-detail.component.html',
  styleUrls: ['./inventory-entry-detail.component.css', '../../../../assets/scss/plugins/_datepicker.scss']
})
export class InventoryEntryDetailComponent implements OnInit, OnDestroy {
  bill: Bill;
  billForm: FormGroup;
  paymentForm: FormGroup;
  subscription: Subscription;
  accounts: Account[];
  categories: Observable<Category[]>;
  itemUnits: ItemUnit[];

  id: number;
  isTransfer: boolean;
  sidePanelOpen: boolean;
  submitted: boolean;
  submitted_item: boolean;
  submitted_payment: boolean;

  items: Item[] = [];
  destinationRoomId: number;
  inventoryStorages: InventoryStorage[] = [];

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

  editMode: boolean;

  constructor(
    public appService: AppService,
    public utilityService: UtilityService,
    private accountService: AccountService,
    private accountingService: AccountingService,
    private billService: BillService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private inventoryService: InventoryService,
    private printService: PrintService,
    private modalService: NgbModal,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private settingsCompanyService: SettingsCompanyService,
    private storageService: SettingsStructureStorageService,
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
    this.getItemUnits();

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
      // bill_id: this.bill.id,
      item: [null, Validators.required],
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      total: 0,
      storage_id: [null, Validators.required],
      unit_id: [null, Validators.required],
      sku: null,
      meta: null,
      units: null,
      state: 'NEW',
      Taxes: null
    });

    this.submitted_item = false;
    this.editMode = true;
    this.BillItems.push(fg);
  }

  appendItem() {
    if (this.editMode) {
      this.submitted_item = true;
      if (this.BillItems.valid) {
        const billItem = this.BillItems.controls[this.BillItems.length - 1];
        if (billItem) {
          let item = billItem.value;
          this.saveIndividualItem(item);
        }
      }
    }
    else {
      this.addItem();
    }
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
    this.billService.cancelWithUnit(this.bill)
      .toPromise()
      .then(res => {
        this.resetForm();
        this.notification.info(null, 'BILL_CANCELED');
      })
      .catch(err => this.notification.error(null, err.error));
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

  print() {
    this.printService.billWithUnit(this.bill);
  }

  @Confirmable({title: 'Supprimer le produit'})
  removeItem(index: number, id: number) {
    if (!id) {
      this.BillItems.removeAt(index);
      this.editMode = false;
    }
    else {
      this.billService.removeItem(this.bill.id, id).toPromise().then(() => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      }).catch(err => this.notification.error(null, err.error));
    }
  }

  onSelectPaymentMethod(event): void {
    event.preventDefault();

    this.paymentForm.patchValue({
      payment_method: event.item.code,
      payment_method_name: event.item.name
    });
  }

  openAppendModal() {
    const modal = this.modalService.open(AppendItemModalComponent, {
      size: 'md' as any
    });

    modal.componentInstance.roomId = this.destinationRoomId;
    modal.componentInstance.type = 'BILL';
    
    modal.result.then(item => {
      this.saveIndividualItem(item);
    }).catch(() => {
      console.log('Dismissed');
    });
  }

  updateBill(): void {
    this.submitted = true;

    if (this.billForm.valid) {
      const formValue = this.billForm.getRawValue();
      const bill = new Bill(Object.assign({}, this.bill, {
        category_id: formValue.category.id,
        category_name: formValue.category.id,
        contact_id: formValue.contact.id,
        bill_number: formValue.bill_number,
        contact_name: formValue.contact.name,
        due_at: formValue.due_at
      }));

      delete bill.BillItems;

      this.billService.updateInfo(bill)
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
      const item = Object.assign({}, array[i], {Taxes: []});

      this.BillItems.push(
        this.formBuilder.group({
          ...item,
          item
        })
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
    this.billService.get(id)
      .toPromise()
      .then(bill => {
        this.bill = bill;
        this.Total.payment = this.accountingService.getTotalPayment(bill.Payments);
        this.Total.payment_due = this.accountingService.getPaymentDue(bill.BillItems);
        this.Total.balance = this.Total.payment_due - this.Total.payment;

        this.isTransfer = +this.settingsCompanyService.getCompanyDefaultSettings('default_bill_inventory_transfer_category') === this.bill.category_id;

        setTimeout(() => {
          this.billForm.patchValue(Object.assign({}, bill, {
            contact: bill.Contact,
            category: bill.Category,
            billed_at: new Date(bill.billed_at),
            due_at: new Date(bill.due_at)
          }));
        });

        this.getStorages();

        this.arrayToForm(bill.BillItems);
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private getItemUnits() {
    this.inventoryService.getItemUnits().then(units => {
      this.itemUnits = units;
    }).catch(err => this.notification.error(null, err.error));
  }

  private getStorages() {
    this.storageService.list().toPromise().then(storages => {
      this.inventoryStorages = storages;

      if (this.bill.category_id === this.settingsCompanyService.getCompanyDefaultSettings('default_bill_inventory_transfer')) {
        if (this.bill && this.bill.BillItems.length) {
          const storage = this.inventoryStorages.find(storage => storage.id === this.bill.BillItems[0].storage_id);

          if (storage) {
            this.destinationRoomId = storage.room_id;
          }
          else {
            this.notification.error(null, 'STORAGE_NOT_FOUND');
          }
        }
        else {
          this.notification.error(null, 'STORAGE_NOT_FOUND');
        }
      }
      else {
        this.destinationRoomId = this.settingsCompanyService.getCompanyDefaultSettings('default_inventory_room');
      }
    }).catch(err => this.notification.error(null, err.error));
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
        switchMap(term => term.length <= 3 ? [] :
          this.inventoryService.select(term)
            .toPromise()
            .then(res => {
              return res.length > 0 ? res : [null];
            })
            .catch(err => {
              this.notification.error(null, err.error);
              return [];
            })
        )
      );
  }

  private resetForm() {
    this.bill = null;
    this.billForm.reset();
    this.submitted = false;
    while(this.BillItems.length) {
      this.BillItems.removeAt(0);
    }

    this.getBill(this.id);
  }

  private saveIndividualItem(item: any) {
    item = {
      ...item,
      bill_id: this.bill.id
    };

    delete item.item;
    delete item.units;

    this.billService.addItem(this.bill.id, item).toPromise().then(() => {
      this.resetForm();
      this.notification.success(null, 'SAVE_SUCCESS');
      this.editMode = false;
    }).catch(err => {
      console.log(err);
      this.notification.error(null, err.error);
    });
  }
}
