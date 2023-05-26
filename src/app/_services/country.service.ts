import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {COUNTRY_CODES} from '../shared/config/country.config';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) { }

  getCountryCodes(lang): Promise<any> { //  +name
    const url = 'https://flagcdn.com/' + lang + '/codes.json';
    return this.http.get(url).toPromise();
  }

  getCountryByPhoneNumber(phone_number) {
    if (phone_number) {
      const result = this.getCountries().find(item => {
        const regex = new RegExp(`^${item.phone}`, 'g');
        return regex.test(phone_number);
      });

      return result || null;
    }

    return null;
  }

  getCountryPhoneCodes(): Promise<any> {  //  3 digits
    const url = 'http://country.io/phone.json';
    return this.http.get(url).toPromise();
  }

  getCountries(): any[] {
    return COUNTRY_CODES.filter(item => item.hasOwnProperty('phone') && item.phone && item.phone !== '');
  }
}
