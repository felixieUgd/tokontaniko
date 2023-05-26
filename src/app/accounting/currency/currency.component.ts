import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import Currency from 'src/app/models/currency';

import {CurrencyService} from './currency.service';
import {NotificationService} from 'src/app/_services/notification.service';

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html'
})
export class CurrencyComponent implements OnInit {
  currency: Currency;
  currencies: Currency[];
  currencyForm: FormGroup;

  sidePanelOpen: boolean;
  submitted: boolean;

  constructor(private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private notification: NotificationService) {}

  ngOnInit() {
    this.sidePanelOpen = false;
    this.submitted = false;

    this.currencyForm = this.formBuilder.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      rate: [1, Validators.required],
      symbol: ['', Validators.required],
      enabled: [true, Validators.required],
      default: false
    });

    this.fetchCurrencies();
  }

  displayRate(exchangeRate) {
    return exchangeRate ? (1 / exchangeRate).toFixed(8) : '';
  }

  edit(currency: Currency) {
    this.currencyService.get(currency.id)
      .toPromise()
      .then(res => {
        this.currency = new Currency(res);
        this.currencyForm.patchValue(Object.assign({}, res, {
          rate: (1 / res.rate).toFixed(2)
        }));
        this.sidePanelOpen = true;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  create(values) {
    this.currencyService.create(values)
      .toPromise()
      .then(res => {
        this.notification.success(null, 'SAVE_SUCCESS');
        this.reset();
        this.fetchCurrencies();
      })
      .catch(err => this.notification.error(null, err.error));
  }

  save() {
    this.submitted = true;

    if (this.currencyForm.valid) {
      if (this.currency) {
        const values = new Currency(Object.assign({}, this.currencyForm.value, {
          id: this.currency.id,
          rate: (1 / this.currencyForm.get('rate').value).toFixed(8)
        }));

        this.update(values);
      }
      else {
        const values = new Currency(Object.assign({}, this.currencyForm.value, {
          rate: (1 / this.currencyForm.get('rate').value).toFixed(8)
        }));

        this.create(values);
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  reset() {
    this.sidePanelOpen = false;
    this.submitted = false;
    this.currency = null;
    this.currencyForm.reset({
      enabled: true
    });
  }

  update(values) {
    this.currencyService.update(values)
      .toPromise()
      .then(res => {
        this.notification.success(null, 'UPDATE_SUCCESS');
        this.reset();
        this.fetchCurrencies();
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private fetchCurrencies() {
    this.currencyService.list({type: 'all'})
      .toPromise()
      .then(res => this.currencies = res)
      .catch(err => this.notification.error(null, err.error));
  }
}
