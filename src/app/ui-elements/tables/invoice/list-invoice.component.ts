import {Component, Input, OnInit} from '@angular/core';
import Bill from 'src/app/models/bill';
import Invoice from 'src/app/models/invoice';
import {UtilityService} from 'src/app/_services/utility.service';

@Component({
  selector: 'app-list-invoice',
  templateUrl: './list-invoice.component.html',
  styleUrls: []
})
export class ListInvoiceComponent implements OnInit {
  @Input() dataTable: Array<Invoice | Bill>;
  @Input() redirectLink: string;
  @Input() linkParams: any;

  constructor(
    public utilityService: UtilityService
  ) { }

  ngOnInit() {
  }

}
