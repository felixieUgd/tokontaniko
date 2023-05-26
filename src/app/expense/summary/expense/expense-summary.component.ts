import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {concat, of, Subject, Subscription} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/internal/operators';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';
import {SmartTable, of as ofST, TableState} from 'smart-table-ng';
import server from 'smart-table-server';
import {FilterConfiguration, FilterOperator} from 'smart-table-core';

import Contact from 'src/app/models/contact';
import Expense from '../../../models/expense';
import Account from 'src/app/models/account';
import Category from 'src/app/models/category';

import {AccountService} from '../../../accounting/account/account.service';
import {AppService} from '../../../app.service';
import {ContactService} from '../../../contact/contact.service';
import {ExpenseService} from '../../expense.service';
import {CategoryService} from '../../../accounting/category/category.service';
import {NotificationService} from '../../../_services/notification.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {ConfirmModalComponent} from 'src/app/ui-elements/modals/confirm-modal/confirm-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SessionService} from 'src/app/_services/session.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {ExportService} from 'src/app/_services/export.service';
import {FirstNamePipe} from 'src/app/shared/pipe/first-name.pipe';

@Component({
  selector: 'app-expense-summary',
  templateUrl: './expense-summary-table.html',
  providers: [
    {
      provide: SmartTable,
      useFactory: (expenseService: ExpenseService) => ofST(
        [],
        expenseService.getConfig(),
        server({
          query: (tableState) => expenseService.paginate(tableState)
        })
      ),
      deps: [ExpenseService]
    }
  ]
})
export class ExpenseSummaryComponent implements OnInit, OnDestroy {
  @Output() reloadSummaryEvent = new EventEmitter<boolean>();
  contactInput$ = new Subject<string>();
  subscription = new Subscription();

  accounts: Array<Account>;
  categories: Array<Category>;
  expenseForm: FormGroup;
  selectedCategory: Category;
  selectedContact: Contact;
  selectedExpense: Expense;

  minDate;
  selectedPaymentMethod: string;
  sidePanelOpen: boolean;
  submitted: boolean;
  paymentMethods: any;

  displayedRows = [25, 50, 100, 1000];

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    public smartTableService: SmartTableService,
    private accountService: AccountService,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private expenseService: ExpenseService,
    private exportService: ExportService,
    private firstNamePipe: FirstNamePipe,
    private formBuilder: FormBuilder,
    private ngbModal: NgbModal,
    private notification: NotificationService,
    private sessionService: SessionService,
    private utilityService: UtilityService
  ) {}

  ngOnInit() {
    this.minDate = this.appService.getCurrentDate();
    this.paymentMethods = this.appService.paymentMethods;

    this.accountService.list()
      .pipe(map(item => _orderBy(item, ['name'], ['asc'])))
      .toPromise()
      .then(res => this.accounts = res)
      .catch(err => this.notification.error(null, err.error));

    this.categoryService.list({type: 'expense'})
      .pipe(map(item => _orderBy(item, ['name'], ['asc'])))
      .toPromise()
      .then(res => this.categories = res)
      .catch(err => this.notification.error(null, err.error));

    this.initForm();
    this.initFilters();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  contact$ = concat(
    of([]),
    this.contactInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.contactService.select(term)
        .toPromise()
        .then(res => {
          return res.length > 0 ? res : [null];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  openSidePanel() {
    this.sidePanelOpen = true;
    this.expenseForm.reset({
      account_id: this.sessionService.getUserExtra('account_id'),
      currency: false,
      paid_at: new Date()
    });
  }

  closeSidePanel() {
    this.sidePanelOpen = false;
    this.submitted = false;
    this.selectedExpense = null;
  }

  convertAmount(amount: number) {
    const currency = this.expenseForm.get('currency').value;

    if (currency) this.expenseForm.patchValue({amount: amount * 5});
    else this.expenseForm.patchValue({amount: amount / 5});
  }

  deleteExpense() {
    const modalRef = this.ngbModal.open(ConfirmModalComponent, {backdrop: 'static'});

    modalRef.componentInstance.type = 'danger';
    modalRef.result.then(val => {
      if (val) {
        this.expenseService.delete(this.selectedExpense.id)
          .then(res => {
            this.reset();
            this.notification.success(null, 'DELETE_SUCCESS');
          })
          .catch(err => this.notification.info(null, err.error));
      }
    });
  }

  edit(item: Expense) {
    this.selectedExpense = item;
    this.expenseForm.reset();
    this.expenseForm.patchValue({
      account_id: item.account_id,
      amount: item.amount,
      category_id: item.category_id,
      contact: item.Contact,
      description: item.description,
      paid_at: moment(item.paid_at).toDate(),
      payment_method: item.payment_method
    });

    this.submitted = false;
    this.sidePanelOpen = true;
  }

  exportToExcel(data, filename) {
    const mapped = data.map(item => {
      return {
        id: item.id,
        invoice_id: item.Bill ? item.Bill.id : '',
        contact: (item.Contact ? item.Contact.name : '') || item.contact_name,
        category: item.Category ? item.Category.name : '',
        description: item.description,
        amount: item.amount,
        compte: item.Account ? item.Account.name : '',
        payment: item.payment_method,
        created: moment(item.created_at).format('YYYY-MM-DD HH:mm')
      };
    });

    this.exportService.exportToExcel(mapped, filename);
  }

  fetchExpenses(dateParams?: any) {
    const params: FilterConfiguration = {
      paid_at: [
        {
          value: dateParams.start,
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string'
        },
        {
          value: dateParams.end,
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'string'
        }
      ]
    };
    this._table.filter(params);
  }

  onSelectCategory(event: Category) {
    if (event) {
      this.utilityService.filterBy(this._table, 'category_id', event.id, FilterOperator.EQUALS);
    }
    else {
      this.selectedCategory = null;
      this.utilityService.clearFilter(this._table, 'category_id');
    }
  }

  onSelectContact(event: Contact) {
    if (event) {
      this.utilityService.filterBy(this._table, 'contact_id', event.id, FilterOperator.EQUALS);
    }
    else {
      this.selectedContact = null;
      this.utilityService.clearFilter(this._table, 'contact_id');
    }
  }

  reset() {
    this.reloadSummaryEvent.emit(true);
    this.utilityService.clearFilter(this._table, ['paid_at', 'contact_id', 'category_id', 'description']);

    this.closeSidePanel();
  }

  save() {
    this.submitted = true;

    if (this.expenseForm.valid) {
      const cT = moment();
      const formValue = this.expenseForm.getRawValue();
      const body = Object.assign({}, formValue, {
        amount: +formValue.amount,
        contact_id: formValue.contact.id,
        contact_name: formValue.contact.name,
        currency_code: 'MGA',
        currency_rate: 1,
        paid_at: moment(formValue.paid_at).set({
          hours: cT.get('hours'),
          minutes: cT.get('minutes')
        }).format(),
        type: 'PAYMENT'
      });

      if (this.selectedExpense) {
        this.sidePanelOpen = false;
        this.notification.info(null, 'COMING_SOON');

        /* this.expenseService.update(this.selectedExpense.id, body)
          .then(res => {
            this.reset();
            this.notification.success(null, 'UPDATE_SUCCESS');
          })
          .catch(err => {
            this.notification.error(null, err.error);
          }); */
      }
      else {
        this.expenseService.create(body)
          .toPromise()
          .then(res => {
            this.reset();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initFilters() {
    const sessionState = sessionStorage.getItem(ExpenseService.TS_KEY);

    if (sessionState) {
      const tableState: TableState = JSON.parse(sessionState);
      const filter = tableState.filter;

      this.selectedCategory = this.utilityService.getFilterValueId(filter, 'category_id');
      this.selectedContact = this.utilityService.getFilterValueId(filter, 'contact_id');
      this.selectedPaymentMethod = this.utilityService.getFilterValueId(filter, 'payment_method');
    }
  }

  private initForm() {
    this.submitted = false;
    this.expenseForm = this.formBuilder.group({
      amount: [null, Validators.required],
      currency: false,  //  false:Ar, true:Fmg
      account_id: [null, Validators.required],
      category_id: [null, Validators.required],
      contact: null,
      description: [null, Validators.required],
      paid_at: [null, Validators.required],
      payment_method: [null, Validators.required]
    });
  }
}
