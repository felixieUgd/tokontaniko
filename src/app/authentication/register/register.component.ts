import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NotificationService} from '../../_services/notification.service';
import {verifyPassword} from '../../shared/directives/verify-password.directive';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  submitted;

  constructor(private formBuilder: FormBuilder,
              private notification: NotificationService) {
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/(?=^.{8,}$)(?=.*\d)(?=.*[A-Za-z\d]).*$/)]],
      passwordConfirm: ['', Validators.required]
    }, {validator: verifyPassword});
  }

  signUp() {
    this.submitted = true;

    if (this.registerForm.valid) {
      // TODO: Api call
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID')
    }
  }

}
