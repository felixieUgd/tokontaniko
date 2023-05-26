import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {Idle} from '@ng-idle/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import User from 'src/app/models/user';

import {AuthenticationService} from 'src/app/_services/authentication.service';
import {NotificationService} from 'src/app/_services/notification.service';

@Component({
  selector: 'app-lock-screen',
  templateUrl: './lock-screen.component.html',
  styleUrls: ['./lock-screen.component.css']
})
export class LockScreenComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  user: User;

  submitted: boolean;

  constructor(public activeModal: NgbActiveModal,
              private authService: AuthenticationService,
              private formBuilder: FormBuilder,
              private idle: Idle,
              private notification: NotificationService) {
  }

  ngOnInit() {
    const session: any = JSON.parse(sessionStorage.getItem('session'));
    this.user = session ? new User(session.user) : null;
    this.initForm();
  }

  ngAfterViewInit(): void {
    sessionStorage.removeItem('token');
  }

  getUserPhoto() {
    return this.user ? this.user.photo : '';
  }

  logout() {
    this.authService.logout();
    this.activeModal.dismiss();
  }

  onload() {
    // sessionStorage.removeItem('token');
  }

  signIn() {
    this.submitted = true;

    if (this.form.valid) {
      const email = this.user.email;
      const password = this.form.controls['password'].value;

      this.authService.login(email, password)
        .toPromise()
        .then(res => {
          if (res && res['token']) {
            sessionStorage.setItem('token', res['token']);
            sessionStorage.setItem('session', JSON.stringify({
              user: res['user'],
              config: res['config']
            }));

            this.activeModal.dismiss();
            this.idle.watch();
          }
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.form = this.formBuilder.group({
      password: [null, Validators.required]
    })
  }
}
