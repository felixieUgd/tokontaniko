import {Injectable} from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';
import { Observable } from 'rxjs';
import {AppService} from '../app.service';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  constructor(private db: AngularFireDatabase) {
  }

  updateStatusChanged(): Observable<any> {
    return this.db
      .object(`/${AppService.APP_ID}/updateStatus`)
      .valueChanges();
  }

}
