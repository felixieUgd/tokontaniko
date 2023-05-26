import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import Currency from 'src/app/models/currency';
import {AppService} from 'src/app/app.service';



@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  constructor(private http: HttpClient) {
  }

  create(category: Currency): Observable<Currency> {
    const url = [AppService.API, 'currencies'].join('/');
    return this.http.post<Currency>(url, category);
  }

  get(id): Observable<Currency> {
    const url = [AppService.API, 'currencies', id].join('/');
    return this.http.get<Currency>(url);
  }

  list(params?: any): Observable<Currency[]> {
    const url = [AppService.API, 'currencies'].join('/');
    return this.http.get<Currency[]>(url, {params: params});
  }

  update(currency: Currency): Observable<Currency> {
    const url = [AppService.API, 'currencies', currency.id].join('/');
    return this.http.put<Currency>(url, currency);
  }
}
