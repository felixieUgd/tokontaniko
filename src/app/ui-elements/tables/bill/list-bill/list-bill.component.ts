import { Component, OnInit, Input } from '@angular/core';
import { UtilityService } from 'src/app/_services/utility.service';
import Bill from 'src/app/models/bill';

@Component({
  selector: 'app-list-bill',
  templateUrl: './list-bill.component.html'
})
export class ListBillComponent implements OnInit {
  @Input() Bills: Bill[];
  @Input() redirectLink: string;

  constructor(private utilityService: UtilityService) { }

  ngOnInit() {
  }

  bgColor = (status) => this.utilityService.statusStyle(status).background;
}
