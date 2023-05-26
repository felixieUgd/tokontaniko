import {FormControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import * as moment from 'moment';

export class FormControlWarn extends FormControl { warning: any; }

export function validateDoc(): ValidatorFn {
  return (control: FormControlWarn) : ValidationErrors | null => {
    const inputDate = moment(control.value);
    control.warning = moment().isAfter(inputDate, 'day') ? true : null;

    return null;
  }
}

export function validateDateRange(): ValidatorFn {
  return (group: FormGroup): ValidationErrors | null => {
    const value = group.getRawValue();
    let diff = 0;

    if (value.start && value.end) {
      diff = moment(value.end).diff(moment(value.start), 'day');
    }

    return diff < 0 ? {invalidRange: true} : null;
  }
}


