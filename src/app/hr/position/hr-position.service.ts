import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import Position from 'src/app/models/position';
import {AppService} from 'src/app/app.service';



@Injectable({
  providedIn: 'root'
})
export class HrPositionService {

  constructor(private http: HttpClient) { }

  create(body): Observable<Position> {
    const url = [AppService.API, 'hr/positions'].join('/');
    return this.http.post<Position>(url, body);
  }

  delete(id): Promise<any> {
    const url = [AppService.API, 'hr/positions', id].join('/');
    return this.http.delete<any>(url).toPromise();
  }

  get(id): Promise<Position> {
    const url = [AppService.API, 'hr/positions', id].join('/');
    return this.http.get<Position>(url).toPromise();
  }

  getNoteConfig() {
    return {
      placeholder: '',
      tabsize: 2,
      height: '300px',
      toolbar: [
          ['font', ['bold', 'italic', 'underline']],
          ['fontsize', ['fontname', 'fontsize', 'color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['insert', ['table', 'link']]
      ],
      fontNames: ['Helvetica', 'Arial']
    }
  }

  list(): Promise<Position[]> {
    const url = [AppService.API, 'hr/positions'].join('/');
    return this.http.get<Position[]>(url).toPromise();
  }

  update(body, id): Observable<Position> {
    const url = [AppService.API, 'hr/positions', id].join('/');
    return this.http.put<Position>(url, body);
  }
}
