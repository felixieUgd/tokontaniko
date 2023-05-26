import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NotificationService} from '../../_services/notification.service';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent implements OnInit {
  resetForm: FormGroup;
  submitted;

  constructor(private formBuilder: FormBuilder,
              private notification: NotificationService) {
  }

  ngOnInit() {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  send() {
    this.submitted = true;

    if (this.resetForm.valid) {
      // TODO: Api call
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID')
    }
  }

}
