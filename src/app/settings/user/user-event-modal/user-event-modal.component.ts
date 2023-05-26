import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment';

import {AppService} from 'src/app/app.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {UserService} from '../user.service';

@Component({
  selector: 'app-user-event-modal',
  templateUrl: './user-event-modal.component.html',
  styleUrls: ['./user-event-modal.component.css', '../../../../assets/scss/plugins/_datepicker.scss']
})
export class UserEventModalComponent implements OnInit {
  @Input() user;
  form: FormGroup;

  event_types: any[];
  scores: number[];
  submitted: boolean;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.scores = Array.from({length: 5}, (_, index) => index + 1);
    this.event_types = AppService.EVENT_TYPES;
    this.initForm();
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const formValue = this.form.value;
      const body = Object.assign(
        {},
        formValue,
        {
          event_date: moment(formValue.event_date).format()
        }
      );

      this.userService.createEvent(this.user.id, body)
        .then(res => {
          this.notification.success(null, 'SAVE_SUCCESS');
          this.activeModal.close(true);
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else this.notification.error(null, 'FORM_NOT_VALID');
  }

  private initForm() {
    this.form = this.formBuilder.group({
      comment: [null, Validators.required],
      event_date: [null, Validators.required],
      score: [null, Validators.required],
      type: [null, Validators.required]
    });
  }

}
