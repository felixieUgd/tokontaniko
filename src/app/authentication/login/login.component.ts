import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import {AngularFireAuth} from 'angularfire2/auth';

import {environment} from 'src/environments/environment';

import {AuthenticationService} from 'src/app/_services/authentication.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {Idle} from '@ng-idle/core';
import {UtilityService} from 'src/app/_services/utility.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/app.service';

const VERSION = environment.version;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm: FormGroup;

  app_copyright: number;
  app_version;
  api: string;
  display_id: string;
  logoUrl: string;
  submitted: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private firebaseAuth: AngularFireAuth,
    private router: Router,
    private idle: Idle,
    private modalService: NgbModal,
    private authService: AuthenticationService,
    private notification: NotificationService,
    private utilityService: UtilityService
  ) { }

  ngOnInit() {
    this.app_copyright = new Date().getFullYear();
    this.api = AppService.API;
    this.app_version = VERSION;
    this.display_id = localStorage.getItem('DISPLAY_ID');

    this.loginForm = this.formBuilder.group({
      email: [null, Validators.required],
      password: [null, Validators.required],
      api: [
        this.api || null,
        Validators.required
      ],
      display_id: this.display_id ? this.display_id : null
    });

    // dismiss all active modal
    this.modalService.dismissAll();

    if (this.idle) {
      this.idle.stop();
    }

    this.setLogo();
  }

  ngAfterViewInit(): void {
  }

  clearAppID() {
    localStorage.removeItem('API');
    localStorage.removeItem('APP_ID');
    localStorage.removeItem('DISPLAY_ID');

    this.display_id = null;
    this.api = null;
    this.submitted = false;
    this.loginForm.reset();
    this.setLogo();
  }

  setLogo() {
    this.logoUrl = this.utilityService.getImageUrl(AppService.APP_ID, 'LOGO');
    const favIcon: HTMLLinkElement = document.querySelector('#appIcon');

    if (favIcon) {
      favIcon.href = this.logoUrl;
    }
  }

  signIn() {
    this.submitted = true;

    if (this.loginForm.valid) {
      const formValue = this.loginForm.value;

      AppService.API = `${formValue.api}`;

      if (formValue.display_id) {
        localStorage.setItem('DISPLAY_ID', formValue.display_id);
      }

      this.authService.login(formValue.email, formValue.password)
        .toPromise()
        .then(res => {
          if (res && res['token']) {
            const user = res['user'];

            user.activeRoleIndex = 0;

            sessionStorage.setItem('token', res['token']);
            sessionStorage.setItem('session', JSON.stringify({
              user: user,
              config: res['config']
            }));

            this.router.navigate([user.defaultRoutes[0] || '/dashboard/announcement']);

          }

          this.firebaseAuth
            .auth
            .signInWithCustomToken(res['fbToken'])
            .catch(err => {
              this.notification.error(null, err.error);
            });
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }
}
