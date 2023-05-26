import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent implements OnInit {
  @Input() title: string;
  @Input() text: string;
  @Input() type:  'info' | 'warning' | 'danger' | 'primary';

  constructor(
    public modal: NgbActiveModal
  ) {
    this.type = 'info';
  }

  ngOnInit() {
  }

}
