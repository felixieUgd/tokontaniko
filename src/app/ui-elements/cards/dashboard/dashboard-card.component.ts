import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-card',
  templateUrl: './dashboard-card.component.html',
  styleUrls: ['./dashboard-card.component.css']
})
export class DashboardCardComponent implements OnInit {
  @Input() title: string;
  @Input() value: string;
  @Input() icon: string;
  @Input() startColor: string = "#fff";
  @Input() endColor: string = "#fff";
  @Input() textColor: string = "#000";
  
  constructor() { }

  ngOnInit() {
  }

}
