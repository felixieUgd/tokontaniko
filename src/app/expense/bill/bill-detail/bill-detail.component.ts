import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbDateParserFormatter, NgbModal} from '@ng-bootstrap/ng-bootstrap';

import Bill from '../../../models/bill';
import Category from 'src/app/models/category';
import Item, {ItemUnit} from 'src/app/models/item';
import Tax from 'src/app/models/tax';

import {AppendItemModalComponent} from 'src/app/ui-elements/modals/append-item-modal/append-item-modal.component';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';
import {TokotanikoDateParserFormatter} from '../../../_helpers/tokotaniko-date-parser-formatter';

import {AccountingService} from 'src/app/_services/accounting.service';
import {AppService} from '../../../app.service';
import {BillService} from '../bill.service';
import {InventoryService} from 'src/app/inventory/inventory.service';
import {ItemService} from '../../../accounting/item/item.service';
import {NotificationService} from '../../../_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SharedService} from 'src/app/_services/shared.service';
import {SessionService} from 'src/app/_services/session.service';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {CategoryService} from 'src/app/accounting/category/category.service';

@Component({
  selector: 'app-bill-detail',
  templateUrl: './bill-detail.component.html',
  styleUrls: ['./bill-detail.component.css', '../../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: TokotanikoDateParserFormatter}]
})
export class BillDetailComponent implements OnInit, OnDestroy {
  bill: Bill;
  billForm: FormGroup;
  categories: Observable<Category[]>;
  subscription = new Subscription();
  taxes: Tax[];

  items: Item[] = [];
  itemUnits: ItemUnit[] = [];

  id: number;
  submitted: boolean;

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
    private modalService: NgbModal,
    private accountingService: AccountingService,
    private billService: BillService,
    private categoryService: CategoryService,
    private taxService: TaxService,
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private printService: PrintService,
    private inventoryService: InventoryService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.categories = this.categoryService.list({type: 'expense'});
    this.id = +this.route.snapshot.paramMap.get('id');
    this.submitted = false;

    this.getBill(this.id);
    this.getTaxes();
    this.getUnits();

    this.initBillForm();
    this.initTypeahead();

    this.subscription.add(
      this.sharedService.contact$.subscribe(contact => {
        if (contact) {
          this.billForm.patchValue({
            contact_id: contact.id,
            contact_name: contact.name
          });

          this.bill.Contact.email = contact.email;
          this.bill.Contact.phone = contact.phone;
        }
      })
    );

    this.subscription.add(
      this.accountingService.sidePanelPayment.subscribe(value => {
        if (!value) this.resetForm();
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
      bill_id: this.bill.id,
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      total: 0,
      sku: null,
      meta: null,
      unit_id: null,
      storage_id: null,
      item: null,
      state: 'NEW',
      tax: 0,
      Taxes: null
    });

    this.BillItems.push(fg);
  }

  @Confirmable({title: 'Annuler facture'}, true)
  cancel(response?: boolean) {
    if (response) {
      this.billService.cancelWithUnit(this.bill)
        .toPromise()
        .then(res => {
          this.resetForm();
          this.notification.info(null, 'BILL_CANCELED');
        })
        .catch(err => this.notification.error(null, err.error));
    }
  }

  deleteAttachment(docId: string) {
    this.billService.deleteAttachment(this.bill.id, docId)
      .then(() => {
        this.resetForm();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.message));
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

  openAppendModal() {
    const modal = this.modalService.open(AppendItemModalComponent, {
      size: 'md' as any
    });

    const component: AppendItemModalComponent = modal.componentInstance;

    component.type = 'BILL';
    component.hasTaxes = true;
    modal.result.then(item => {
      this.saveIndividualItem(item);
    }).catch(() => {
      console.log('Dismissed');
    });
  }

  openSidePanelPayment() {
    this.accountingService.facture.next(this.bill);
    this.accountingService.sidePanelPayment.next(true);
  }

  print(isGrouped?: boolean) {
    if (isGrouped) this.printService.bill(this.bill, true);
    else this.printService.bill(this.bill);
  }

  @Confirmable({title: 'Supprimer le produit'}, true)
  removeItem(index: number, id: number, response?: boolean) {
    if (response) {
      this.billService.removeItem(this.bill.id, id).toPromise().then(() => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      }).catch(err => this.notification.error(null, err.error));
    }
  }

  updateBill(): void {
    this.submitted = true;

    if (this.billForm.valid) {
      const formValue = this.billForm.getRawValue();
      const bill = new Bill(Object.assign({}, this.bill, {
        category_id: formValue.category.id,
        category_name: formValue.category.name,
        contact_id: this.bill.contact_id,
        contact_name: this.bill.contact_name,
        due_at: formValue.due_at,
        notes: formValue.notes
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
      const item = Object.assign({}, {description: null}, array[i], {item: array[i]}, {Taxes: []})

      this.BillItems.push(
        this.formBuilder.group(item)
      );
    }
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

  private getTaxes() {
    this.taxService.list().pipe(
      map(taxes => {
        return taxes.map(tax => {
          tax['disabled'] = true;
          return tax;
        })
      })
    ).toPromise().then(taxes => {
      this.taxes = taxes;
    }).catch(err => this.notification.error(null, err.error));
  }

  private getUnits() {
    this.inventoryService.getItemUnits().then(units => {
      this.itemUnits = units;
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
      notes: null,
      BillItems: this.formBuilder.array([])
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
    this.bill = null;

    this.billForm.reset();
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
    }).catch(err => {
      console.log(err);
      this.notification.error(null, err.error);
    });
  }
}
