import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription, throwError} from 'rxjs';
import {map} from 'rxjs/operators';

import _find from 'lodash.find';
import _orderBy from 'lodash.orderby';
import * as moment from 'moment';
import Account from 'src/app/models/account';
import Bill from 'src/app/models/bill';
import Invoice from 'src/app/models/invoice';
import {NgbDate} from '@ng-bootstrap/ng-bootstrap';

import {AccountService} from 'src/app/accounting/account/account.service';
import {AccountingService} from 'src/app/_services/accounting.service';
import {AppService} from 'src/app/app.service';
import {BillService} from 'src/app/expense/bill/bill.service';
import {InvoiceService} from '../../../income/invoice/invoice.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {IncomeService} from 'src/app/income/income.service';
import {ExpenseService} from 'src/app/expense/expense.service';
import {FirstNamePipe} from 'src/app/shared/pipe/first-name.pipe';
import {RoleService} from 'src/app/settings/role/role.service';

@Component({
  selector: 'app-side-panel-payment',
  templateUrl: './side-panel-payment.component.html',
  styleUrls: ['./side-panel-payment.component.css']
})
export class SidePanelPaymentComponent implements OnInit, OnDestroy {
  accounts: Array<Account>;
  form: FormGroup;
  facture: Invoice | Bill;
  rewardForm: FormGroup;
  subscription = new Subscription();

  sidePanelOpen: boolean;
  submitted: boolean;
  submitted_reward: boolean;
  dateLocked;

  constructor(
    public appService: AppService,
    private accountingService: AccountingService,
    private accountService: AccountService,
    private billService: BillService,
    private expenseService: ExpenseService,
    private firstNamePipe: FirstNamePipe,
    private formBuilder: FormBuilder,
    private incomeService: IncomeService,
    private invoiceService: InvoiceService,
    private notification: NotificationService,
    private roleService: RoleService,
    private sessionService: SessionService,
    private utilityService: UtilityService
  ) { }

  ngOnInit() {
    this.initForm();
    this.onSubscribe();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  cashReward() {
    this.submitted_reward = true;

    if (this.rewardForm.valid) {
      const formValue = this.rewardForm.getRawValue();
      const body = {
        account_id: formValue.account_id,
        paid_at: moment(formValue.paid_at).format(),
        currency_code: 'MGA',
        currency_rate: 1,
        category_id: this.facture.category_id,
        payment_method: 'REWARD',
        invoice_id: this.facture.id,
        reward_id: this.facture.Contact.Reward.id,
        type: 'INVOICE_PAYMENT'
      };

      this.invoiceService.cashReward(this.facture.id, body)
        .toPromise()
        .then(res => {
          this.notification.success(null, 'SAVE_SUCCESS');
          this.close();
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  onSelectDate(event: NgbDate, form: FormGroup) {
    const cT = moment();
    const selected = this.utilityService.ngbDateToMoment(event);

    if (cT.isSame(selected, 'day')) {
      form.get('paid_at').setValue(cT.toDate());
    }
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const body = Object.assign({}, formValue, {
        category_id: this.facture.category_id,
        currency_code: 'MGA',
        currency_rate: 1,
        contact_name: this.facture.contact_name || this.facture.Contact.name
      });

      if (this.facture instanceof Bill) {
        body.bill_id = this.facture.id;
        body.type = 'BILL_PAYMENT';

        this.billService.createPayment(this.facture.id, body)
          .toPromise()
          .then(res => {
            this.notification.success(null, 'SAVE_SUCCESS');
            this.close();
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        body.invoice_id = this.facture.id;
        body.type = 'INVOICE_PAYMENT';

        this.invoiceService.createPayment(body)
          .toPromise()
          .then(res => {
            this.sendSMSRole();
            this.notification.success(null, 'SAVE_SUCCESS');
            this.close();
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  close() {
    const cT = moment().toDate();

    this.submitted = false;
    this.form.reset({
      paid_at: {value: cT, disabled: true}
    });
    this.rewardForm.reset({
      paid_at: {value: cT, disabled: true}
    });
    this.accountingService.facture.next(null);
    this.accountingService.payment.next(null);
    this.accountingService.sidePanelPayment.next(false);
  }

  updateLockState(form: FormGroup): void {
    this.dateLocked = !this.dateLocked;
    if (this.dateLocked) form.get('paid_at').disable();
    else form.get('paid_at').enable()
  }

  private initForm() {
    const cT = moment().toDate();

    this.form = this.formBuilder.group({
      description: null,
      paid_at: [
        {value: cT, disabled: true},
        Validators.required
      ],
      amount: [null, Validators.required],
      account_id: [null, Validators.required],
      payment_method: [null, Validators.required]
    });

    this.rewardForm = this.formBuilder.group({
      paid_at: [
        {value: cT, disabled: true},
        Validators.required
      ],
      account_id: [null, Validators.required],
      description: null
    });
  }

  private onSubscribe() {
    this.subscription.add(
      this.accountingService.sidePanelPayment.subscribe(value => {
        this.sidePanelOpen = value;
        if (this.sidePanelOpen) {
          this.dateLocked = true;

          this.accountService.list()
            .pipe(map(item => _orderBy(item, ['name'], ['asc'])))
            .toPromise()
            .then(res => this.accounts = res)
            .catch(err => this.notification.error(null, err.error));
        }
      })
    );

    this.subscription.add(
      this.accountingService.facture.subscribe(value => {
        if (value) {
          let paymentDue;
          let totalPayment;
          let totalTax;
          let totalDiscount;

          if (value.hasOwnProperty('invoice_number') || value.hasOwnProperty('invoiced_at')) {
            this.facture = new Invoice(value);
            paymentDue = this.accountingService.getPaymentDue(this.facture.InvoiceItems);
            totalPayment = this.accountingService.getTotalPayment(this.facture.Revenues);
            totalTax = this.accountingService.getTotalTax(this.facture.InvoiceItems);
            totalDiscount = this.accountingService.getTotalDiscount(this.facture.InvoiceItems);
          }
          else {
            this.facture = new Bill(value);
            paymentDue = this.accountingService.getPaymentDue(this.facture.BillItems);
            totalPayment = this.accountingService.getTotalPayment(this.facture.Payments);
            totalTax = this.accountingService.getTotalTax(this.facture.BillItems);
            totalDiscount = this.accountingService.getTotalDiscount(this.facture.BillItems);
          }

          const accountId = this.sessionService.getUserExtra('account_id');

          this.form.patchValue({
            account_id: accountId,
            amount: paymentDue + totalTax - totalDiscount - totalPayment
          });

          this.rewardForm.patchValue({account_id: accountId});
        }
      })
    );

    this.subscription.add(
      this.accountingService.payment.subscribe(value => {
        if (value) {
          this.form.patchValue({
            account_id: value.account_id || this.sessionService.getUserExtra('account_id'),
            amount: value.amount,
            payment_method: value.payment_method
          });
        }
      })
    );
  }

  private sendSMSRole() {
    const paymentMethod = this.form.get('payment_method').value;

    if (paymentMethod === 'SP') {
      const userName = this.firstNamePipe.transform(this.sessionService.getUser().name);
      const contactName = this.facture.Contact.name || this.facture.contact_name;
      const message = `SP ${contactName} . Facture #${this.facture.id} . U ${userName}`;

      this.roleService.sendSMSRole(message, 'sp').toPromise()
        .then(res => {})
        .catch(err => throwError(err.error))
    }
  }
}
