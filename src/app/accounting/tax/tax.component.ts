import {Component, OnInit} from '@angular/core';
import {FormGroup, Validators, FormBuilder} from '@angular/forms';

import {NotificationService} from 'src/app/_services/notification.service';
import {AppService} from 'src/app/app.service';
import {TaxService} from './tax.service';

import Tax from 'src/app/models/tax';

@Component({
  selector: 'app-tax',
  templateUrl: './tax.component.html'
})
export class TaxComponent implements OnInit {
  taxForm: FormGroup;
  taxes: Tax[];
  tax: Tax;
  types: Array<any>;
  sidePanelOpen;
  submitted;

  constructor(private formBuilder: FormBuilder,
    private appService: AppService,
    private taxService: TaxService,
    private notification: NotificationService) {
  }

  ngOnInit() {
    this.sidePanelOpen = false;
    this.types = this.appService.taxTypes;

    this.initForm();
    this.getTaxes();
  'all'}


  edit(id) {
    this.sidePanelOpen = true;
    this.taxForm.reset();

    this.taxService.get(id)
      .toPromise()
      .then(tax => {
        this.tax = tax;
        this.taxForm.patchValue(tax);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  open() {
    this.sidePanelOpen = true;
    this.tax = null;

    this.taxForm.reset();
  }

  save() {
    this.submitted = true;

    if (this.taxForm.valid) {
      const tax = new Tax(this.taxForm.value);

      if (this.tax) {
        this.update(tax);
      }
      else {
        this.create(tax);
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID')
    }
  }

  private create(tax: Tax) {
    this.taxService.create(tax)
      .toPromise()
      .then(res => {
        this.ngOnInit();
        this.notification.success(null, 'SAVE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private getTaxes() {
    this.taxService.list({type: 'all'})
      .toPromise()
      .then(res => this.taxes = res)
      .catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.taxForm = this.formBuilder.group({
      id: '',
      name: ['', Validators.required],
      rate: ['', Validators.required],
      type: ['', Validators.required],
      enabled: true
    });
  }

  private update(tax: Tax) {
    this.taxService.update(tax)
      .toPromise()
      .then(res => {
        this.ngOnInit();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

}
