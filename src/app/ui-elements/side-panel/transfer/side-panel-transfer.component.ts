import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription, throwError} from 'rxjs';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';

import Account from 'src/app/models/account';
import Category from 'src/app/models/category';

import {AccountService} from 'src/app/accounting/account/account.service';
import {AppService} from 'src/app/app.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {TransferService} from 'src/app/accounting/transfer/transfer.service';
import {FirstNamePipe} from 'src/app/shared/pipe/first-name.pipe';

@Component({
  selector: 'app-side-panel-transfer',
  templateUrl: './side-panel-transfer.component.html',
  styleUrls: ['./side-panel-transfer.component.css', '../../../../assets/scss/plugins/_datepicker.scss']
})
export class SidePanelTransferComponent implements OnInit, OnDestroy {
  accounts: Array<Account>;
  categories: Array<Category>;
  form: FormGroup;
  subscription: Subscription = new Subscription();
  userAccount: Account;

  isOpen: boolean;
  minDate;
  paymentMethods: Array<any>;
  submitted: boolean;

  constructor(
    public appService: AppService,
    private accountService: AccountService,
    private categoryService: CategoryService,
    private firstNamePipe: FirstNamePipe,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private sessionService: SessionService,
    private transferService: TransferService
  ) { }

  ngOnInit() {
    this.minDate = this.appService.getCurrentDate();
    this.paymentMethods = this.appService.paymentMethods;

    this.initForm();

    this.categoryService.list({type: 'other'}).toPromise()
      .then(res => this.categories = res)
      .catch(err => this.notification.error(null, err.error));

    this.accountService.list()
      .toPromise()
      .then(res => this.accounts = _orderBy(res, ['name'], ['asc']))
      .catch(err => this.notification.error(null, err.error));

    this.subscription.add(
      this.transferService.sidePanelTransfer.subscribe(value => {
        this.isOpen = value;

        if (value) {
          this.form.patchValue({
            paid_at: new Date(),
            payment_account_id: this.sessionService.getUserExtra('account_id'),
            payment_method: 'CASH'
          });
        }
      })
    );

    this.subscription.add(
      this.transferService.sidePanelProperties.subscribe(value => {
        if (value) {
          this.form.patchValue(value);

          // min_date : NgbDate format
          if (value.min_date) this.minDate = value.min_date;
        };
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  convertAmount(amount: number) {
    const currency = this.form.get('currency').value;

    if (currency) this.form.patchValue({amount: amount * 5});
    else this.form.patchValue({amount: amount / 5});
  }

  getOne(id: number) {
    this.transferService.get(id)
      .toPromise()
      .then(res => {
        this.form.patchValue(res);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const cT = moment();
      const formValue = this.form.value;
      const body = Object.assign({}, formValue, {
        amount: +formValue.amount,
        category_id: formValue.category_id,
        currency_code: 'MGA',
        currency_rate: 1,
        paid_at: moment(formValue.paid_at).set({
          hours: cT.get('hours'),
          minutes: cT.get('minutes')
        }).format(),
        payment_method: formValue.payment_method,
        payment_account_id: formValue.payment_account_id,
        revenue_account_id: formValue.revenue_account_id
      });

      this.transferService.create(body)
        .toPromise()
        .then(res => {
          this.reset();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  close() {
    this.isOpen = false;
    this.submitted = false;

    this.form.reset({
      currency: false,
      paid_at: new Date(),
      payment_method: 'CASH'
    });
  }

  reset() {
    this.submitted = false;
    this.form.reset({currency: false, paid_at: new Date()});
    this.transferService.setSidePanelTransfer(false);
  }

  private initForm() {
    this.form = this.formBuilder.group({
      category_id: [null, Validators.required],
      currency: false,  //  false:Ar, true:Fmg
      payment_account_id: [null, Validators.required],
      payment_method: [null, Validators.required],
      revenue_account_id: [null, Validators.required],
      amount: [null, Validators.required],
      paid_at: [null, Validators.required],
      description: [null, Validators.required]
    });
  }
}
