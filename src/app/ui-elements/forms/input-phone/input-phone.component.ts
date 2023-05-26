import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {CountryService} from 'src/app/_services/country.service';
import {NotificationService} from 'src/app/_services/notification.service';

import _map from 'lodash.map';

@Component({
  selector: 'app-input-phone',
  templateUrl: './input-phone.component.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InputPhoneComponent
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: InputPhoneComponent
    }
  ]
})
export class InputPhoneComponent implements OnInit, OnDestroy, AfterViewInit, ControlValueAccessor, Validator {

  @Input() submitted:boolean;

  country: any;
  countries: any[];
  disabled = false;
  touched = false;
  value = null;

  form: FormGroup;
  onChange: any = () => {};
  onTouched: any = () => {};
  onChangeSubs: Subscription[] = [];

  constructor(
    private countryService: CountryService,
    private formBuilder: FormBuilder
  ) { }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  onSelectCountry(event) {
    this.markAsTouched();
    this.form.controls.number.setValue(event.phone, {emitEvent: false});
  }

  writeValue(value: any): void {
    // console.log('writeValue: ', value);
    if (value) {
      this.form.setValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChangeSubs.push(
      this.form.valueChanges.subscribe(fn)
    );
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.form.disable();
    }
    else {
      this.form.enable();
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.form.valid) {
      return null;
    }

    let errors : any = {};

    errors = this.addControlErrors(errors, "country");
    errors = this.addControlErrors(errors, "number");

    return errors;
  }

  ngAfterViewInit(): void {
  }

  ngOnInit() {
    this.countries = this.countryService.getCountries();
    this.form = this.formBuilder.group({
      country: [null, Validators.required],
      number: [null, Validators.required]
    });
  }

  ngOnDestroy() {
    for (let sub of this.onChangeSubs) {
      sub.unsubscribe();
    }
  }

  private addControlErrors(allErrors: any, controlName:string) {
    const errors = {...allErrors};

    const controlErrors = this.form.controls[controlName].errors;

    if (controlErrors) {
      errors[controlName] = controlErrors;
    }

    return errors;
  }

}
