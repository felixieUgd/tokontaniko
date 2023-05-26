import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import Contact from '../models/contact';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private _sidePanelItem = new Subject<boolean>();
  private contactSource = new Subject<Contact>(); //  Contact
  private contactCreateSource = new Subject<Partial<Contact>>();
  private queueSource = new Subject<any>();
  private sidePanelSource = new Subject<boolean>();

  contact$ = this.contactSource.asObservable();
  contactCreate$ = this.contactCreateSource.asObservable();
  queue$ = this.queueSource.asObservable();
  sidePanel$ = this.sidePanelSource.asObservable();

  public get sidePanelItem() {
    return this._sidePanelItem;
  }

  constructor() {}

  newContact(contact: Partial<Contact>) {
    this.contactCreateSource.next(contact);
  }

  assignContact(contact: Contact) {
    this.contactSource.next(contact);
  }

  updateQueue(value) {
    this.queueSource.next(value);
  }

  //  Open/Close side panel
  updateSidePanel(value: boolean) {
    this.sidePanelSource.next(value);
  }

  updateSidePanelItem(value: boolean) {
    this.sidePanelItem.next(value);
  }
}
