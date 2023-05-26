import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import Category from '../../models/category';
import {AppService} from 'src/app/app.service';


@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) {
  }

  create(category: Category): Observable<Category> {
    const url = [AppService.API, 'categories'].join('/');
    return this.http.post<Category>(url, category);
  }

  get(id): Observable<Category> {
    const url = [AppService.API, 'categories', id].join('/');
    return this.http.get<Category>(url);
  }

  list(params?: any): Observable<Category[]> {
    const url = [AppService.API, 'categories'].join('/');
    return this.http.get<Category[]>(url, {params: params});
  }

  update(category: Category): Observable<Category> {
    const url = [AppService.API, 'categories', category.id].join('/');
    return this.http.put<Category>(url, category);
  }
}
