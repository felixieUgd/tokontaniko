import {Component, OnInit, EventEmitter, Output, OnDestroy} from '@angular/core';
import {FormBuilder, Validators, FormGroup} from '@angular/forms';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';
import {SmartTable, of as ofST, TableState} from 'smart-table-ng';
import {FilterConfiguration, FilterOperator} from 'smart-table-core';
import server from 'smart-table-server';

import Category from 'src/app/models/category';
import Account from 'src/app/models/account';
import Revenue from 'src/app/models/revenue';

import {AppService} from 'src/app/app.service';
import {AccountService} from 'src/app/accounting/account/account.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {IncomeService} from 'src/app/income/income.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {ExportService} from '../../../_services/export.service';
import {PrintService} from '../../../_services/print.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmModalComponent} from 'src/app/ui-elements/modals/confirm-modal/confirm-modal.component';
import {SessionService} from 'src/app/_services/session.service';
import Contact from 'src/app/models/contact';
import {concat, of, Subject, Subscription} from 'rxjs';
import {ContactService} from 'src/app/contact/contact.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {FirstNamePipe} from 'src/app/shared/pipe/first-name.pipe';

@Component({
  selector: 'app-revenue-summary',
  templateUrl: './revenue-summary-table.html',
  styleUrls: ['../../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (incomeService: IncomeService) => ofST(
      [],
      incomeService.getConfig(),
      server({
        query: (tableState) => incomeService.paginate(tableState)
      })
    ),
    deps: [IncomeService]
  }]
})
export class RevenueSummaryComponent implements OnInit, OnDestroy {
  @Output() reloadSummaryEvent = new EventEmitter<boolean>();
  contactInput$ = new Subject<string>();

  accounts: Array<Account>;
  categories: Array<Category>;
  addRevenueForm: FormGroup;
  selectedCategory: Category;
  selectedContact: Contact;
  selectedRevenue: Revenue;
  subscription = new Subscription();

  minDate;
  selectedPaymentMethod: string;
  sidePanelOpen: boolean;
  submitted: boolean;
  paymentMethods: any;

  displayedRows = [25, 50, 100, 1000];

  constructor(
    public _table: SmartTable<any>,
    private accountService: AccountService,
    public appService: AppService,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private exportService: ExportService,
    private firstNamePipe: FirstNamePipe,
    private formBuilder: FormBuilder,
    private incomeService: IncomeService,
    private ngbModal: NgbModal,
    private notification: NotificationService,
    public printService: PrintService,
    private sessionService: SessionService,
    public smartTableService: SmartTableService,
    private utilityService: UtilityService
  ) { }

  ngOnInit() {
    this.minDate = this.appService.getCurrentDate();
    this.paymentMethods = this.appService.paymentMethods;
    this.accountService.list()
      .pipe(map(item => _orderBy(item, ['name'], ['asc'])))
      .toPromise()
      .then(res => this.accounts = res)
      .catch(err => this.notification.error(null, err.error));

    this.categoryService.list({type: 'income'})
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
    this.addRevenueForm.reset({
      account_id: this.sessionService.getUserExtra('account_id'),
      currency: false,
      paid_at: new Date()
    });
  }

  closeSidePanel() {
    this.sidePanelOpen = false;
    this.submitted = false;
    this.selectedRevenue = null;
  }

  convertAmount(amount: number) {
    const currency = this.addRevenueForm.get('currency').value;

    if (currency) this.addRevenueForm.patchValue({amount: amount * 5});
    else this.addRevenueForm.patchValue({amount: amount / 5});
  }

  deleteRevenue() {
    const modalRef = this.ngbModal.open(ConfirmModalComponent, {backdrop: 'static'});

    modalRef.componentInstance.type = 'danger';
    modalRef.result
      .then(val => {
        if (val) {
          this.incomeService.delete(this.selectedRevenue.id)
            .then(res => {
              this._table.exec();
              this.closeSidePanel();
              this.notification.success(null, 'DELETE_SUCCESS');
            })
            .catch(err => this.notification.info(null, err.error));
        }
      })
      .catch(err => console.log('modal dismissed ! ', err));
  }

  edit(item: Revenue) {
    this.selectedRevenue = item;
    this.addRevenueForm.reset({paid_at: new Date()});
    this.addRevenueForm.patchValue({
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
        invoice_id: item.Invoice ? item.Invoice.id : '',
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

  fetchRevenues(dateParams?: any) { //  dateParams already formatted
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
      this.utilityService.clearFilter(this._table, 'category_id')
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

  onSelectPaymentMethod(event: any) {
    if (event) {
      this.utilityService.filterBy(this._table, 'payment_method', event.code, FilterOperator.EQUALS);
    }
    else {
      this.selectedContact = null;
      this.utilityService.clearFilter(this._table, 'payment_method');
    }
  }

  reset() {
    this.reloadSummaryEvent.emit(true);
    this.utilityService.clearFilter(this._table, ['paid_at', 'contact_id', 'category_id', 'description']);

    this.closeSidePanel();
  }

  save() {
    this.submitted = true;

    if (this.addRevenueForm.valid) {
      const formValue = this.addRevenueForm.getRawValue();

      if (this.selectedRevenue) {
        this.sidePanelOpen = false;
        this.notification.info(null, 'COMING_SOON');
      }
      else {
        const cT = moment();
        const revenue = new Revenue(Object.assign({}, formValue, {
          amount: +formValue.amount,
          contact_id: formValue.contact.id,
          contact_name: formValue.contact.name,
          currency_code: 'MGA',
          currency_rate: 1,
          paid_at: moment(formValue.paid_at).set({
            hours: cT.get('hours'),
            minutes: cT.get('minutes')
          }).format(),
          type: 'REVENUE'
        }));

        this.incomeService.create(revenue)
          .toPromise()
          .then(res => {
            this.reset()
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else this.notification.error(null, 'FORM_NOT_VALID');
  }

  private initFilters() {
    const sessionState = sessionStorage.getItem(IncomeService.TS_KEY);

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
    this.addRevenueForm = this.formBuilder.group({
      currency: false,  //  false:Ar, true:Fmg
      paid_at: [null, Validators.required],
      amount: [null, Validators.required],
      description: [null, Validators.required],
      contact: null,
      account_id: [null, Validators.required],
      category_id: [null, Validators.required],
      payment_method: [null, Validators.required]
    });
  }

}
