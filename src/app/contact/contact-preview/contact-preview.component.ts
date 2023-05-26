import {Component, OnInit, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-contact-preview',
  templateUrl: './contact-preview.component.html',
  styleUrls: ['./contact-preview.component.css']
})
export class ContactPreviewComponent implements OnInit {
  @Input() idPhoto;
  @Input() type;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (!this.type) {
      this.type = 'documents';
    }
  }

  dismiss() {
    this.activeModal.dismiss();
  }

}
