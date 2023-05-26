import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'firstname'})
export class FirstNamePipe implements PipeTransform {
  transform(value: string, index = 0): string {
    if (value) {
      const split = value.split(' ');

      return split.length ? split[index] : value;
    }

    return value;
  }
}
