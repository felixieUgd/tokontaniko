import {Component, OnInit, EventEmitter, Output, OnDestroy} from '@angular/core';
import {FormGroup, Validators, FormBuilder, ValidatorFn} from '@angular/forms';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import _orderBy from 'lodash.orderby';
import Account from 'src/app/models/account';

import {AccountService} from 'src/app/accounting/account/account.service';
import {ExportService} from 'src/app/_services/export.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SharedService} from 'src/app/_services/shared.service';
import {SessionService} from 'src/app/_services/session.service';
import {PrintService} from 'src/app/_services/print.service';
import {CurrencyPipe} from '@angular/common';
import {Router} from '@angular/router';
import {from, SmartTable} from 'smart-table-ng';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {AppService} from 'src/app/app.service';

interface BooleanFn {
  (): boolean;
}

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  providers: [
    {
      provide: SmartTable,
      useFactory: (service: AccountService) =>
        from(service.list({type: 'all'}), {
          search: {},
          slice: {
            page: 1,
            size: 25
          },
          filter: {},
          sort: {
            pointer: 'createdAt',
            direction: 'desc'
          }
        }),
      deps: [AccountService]
    }
  ]
})
export class AccountComponent implements OnInit, OnDestroy {
  accountForm: FormGroup;
  accounts: Array<Account>;
  account: Account;

  sidePanelOpen;
  submitted: boolean;

  id: number;

  @Output() onClose = new EventEmitter<any>();

  formatter = (item: any) => {
    return item.service_tag || item.license_plate;
  }

  constructor(public _table: SmartTable<Account>,
    public appService: AppService,
    public smartTableService: SmartTableService,
    private exportService: ExportService,
    private accountService: AccountService,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private sessionService: SessionService,
    private sharedService: SharedService,
    private printService: PrintService,
    private router: Router,
    private cp: CurrencyPipe) {
  }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.initForm();
  }

  ngOnDestroy() {}

  close(state?: boolean) {
    this.sidePanelOpen = false;
    this.submitted = false;
    this.accountForm.reset({currency_code: 'MGA'});

    if (this.onClose && this.onClose.observers && this.onClose.observers.length > 0) {
      this.onClose.next(state);
    }
  }

  edit(id) {
    this.sidePanelOpen = true;

    this.accountService.get(id)
      .toPromise()
      .then(account => {
        this.account = account;
        this.accountForm.patchValue(account);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  export = (data: any[]) => {
    const exported = [];

    data.forEach(item => {
      exported.push({
        ID: item.value.id,
        Nom: item.value.name
        /* Numero: item.number,
        Compagnie: item.company_id,
        Contact: item.contact_id,
        Etat: item.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ' */
      });
    });

    this.exportService.exportToExcel(exported, 'Account_list');
  };

  open() {
    this.sidePanelOpen = true;
    this.account = null;
  }

  save() {
    this.submitted = true;

    if (this.accountForm.valid) {
      const body = this.accountForm.value;

      body.contact_id = body.Contact ? body.Contact.id : null;
      body.contact_name = body.Contact ? body.Contact.name : null;

      delete body.Contact;

      const account = new Account(body);

      if (this.account) {
        this.accountService.update(account)
          .toPromise()
          .then(res => {
            this.reset();
            this.notification.success(null, 'UPDATE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        this.accountService.create(account)
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

  private getAccounts() {
    this.accountService.list({type: 'all'})
      .toPromise()
      .then(accounts => this._table.use(accounts))
      .catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.submitted = false;

    this.accountForm = this.formBuilder.group({
      bank_name: null,
      bank_phone: null,
      bank_address: null,
      currency_code: 'MGA',
      enabled: [true, Validators.required],
      id: null,
      name: [null, Validators.required],
      number: [null, Validators.required],
      opening_balance: [0, Validators.required],
      Contact: null
    });
  }

  private conditionalValidator(predicate: BooleanFn, validator: ValidatorFn, errorNamespace?: string): ValidatorFn {
    return (formControl => {
      if (!formControl.parent) {
        return null;
      }
      let error = null;
      if (predicate()) {
        error = validator(formControl);
      }
      if (errorNamespace && error) {
        const customError = {};
        customError[errorNamespace] = error;
        error = customError
      }
      return error;
    })
  }

  private reset() {
    this.accounts = null;
    this.sidePanelOpen = false;
    this.submitted = false;
    this.accountForm.reset({
      card_balance: 0,
      currency_code: 'MGA',
      enabled: true,
      opening_balance: 0
    });

    this.close();
    this.getAccounts();
  }
}
