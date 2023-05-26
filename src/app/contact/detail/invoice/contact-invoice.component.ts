import {Component} from '@angular/core';

import {SmartTable, of} from 'smart-table-ng';
import server from 'smart-table-server';

import {ActivatedRoute} from '@angular/router';
import {ContactService} from '../../contact.service';

const providers = [{
  provide: SmartTable,
  useFactory: (
    activatedRoute: ActivatedRoute,
    contactService: ContactService
  ) => of(
    [],
    {
      search: {},
      filter: {},
      sort: {
        pointer: 'id',
        direction: 'desc'
      },
      slice: {page: 1, size: 50}
    },
    server({
      query: (tableState) => contactService.getInvoices(tableState, activatedRoute, 'invoice')
    })
  ),
  deps: [ActivatedRoute, ContactService]
}];

@Component({
  selector: 'app-contact-invoice',
  templateUrl: './contact-invoice.component.html',
  styleUrls: ['./contact-invoice.component.css'],
  providers
})
export class ContactInvoiceComponent {

  constructor(public _table: SmartTable<any>) {
  }

  refresh() {
    this._table.exec();
  }
}
