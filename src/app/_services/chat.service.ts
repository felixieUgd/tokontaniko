import {Injectable, OnInit} from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';
import {AppService} from '../app.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnInit {

  constructor(private db: AngularFireDatabase) {
  }

  ngOnInit() {
  }

  getMessages() {
    return this.db
      .list(`/${AppService.APP_ID}/messages`, ref => {
        return ref.limitToLast(30);
      })
      .valueChanges(['child_added']);
  }

  sendMessage(message) {
    return this.db.list(`/${AppService.APP_ID}/messages`).push(message);
  }
}
