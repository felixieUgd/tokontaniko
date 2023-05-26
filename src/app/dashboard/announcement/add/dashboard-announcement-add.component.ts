import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import _orderBy from 'lodash.orderby';

import Role from 'src/app/models/role';

import {AppService} from 'src/app/app.service';
import {DashboardService} from '../../dashboard.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {RoleService} from 'src/app/settings/role/role.service';
import {SessionService} from 'src/app/_services/session.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {UserService} from 'src/app/settings/user/user.service';
import {Subject, concat, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-announcement-add',
  templateUrl: './dashboard-announcement-add.component.html',
  styleUrls: ['./dashboard-announcement-add.component.css']
})
export class DashboardAnnouncementAddComponent implements OnInit {
  form: FormGroup;
  roles: Role[];
  staffInput$ = new Subject<string>();

  config: any;
  minDate: any;
  submitted: boolean;

  staff$ = concat(
    of([]),
    this.staffInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.userService.select(term, 'selectByCompany')
        .then(res => {
          return res.length > 0 ? res : [null];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  constructor(private appService: AppService,
              private dashboardService: DashboardService,
              private formBuilder: FormBuilder,
              private notification: NotificationService,
              private roleService: RoleService,
              private router: Router,
              private userService: UserService,
              private utilityService: UtilityService,
              private sessionService: SessionService) {
  }

  ngOnInit() {
    this.minDate = this.appService.getCurrentDate();

    this.initEditor();
    this.initForm();
    this.getRoles();
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const body = Object.assign(
        {},
        this.form.getRawValue(),
        {
          user_id: this.sessionService.getUser().id
        }
      );

      this.dashboardService.createAnnouncement(body)
        .then(async res => {
          this.notification.success(null, 'SAVE_SUCCESS');
          if (body.is_sms) {
            let phones = [];
            for (let r of body.permissions) {
              let role = await this.roleService.getWithUsers(r.id).toPromise();
              phones = role.Users.reduce((res, user) => {
                if (user.Profile && user.Profile.phone_work) {
                  res.push(user.Profile.phone_work);
                }

                return res;
              }, []);
            }

            const message = `Annonce N${res.id} / ${body.title} / ${body.content}`;

            return this.utilityService.sendSMS(phones, message).toPromise().then(() => {
              this.router.navigate(['/dashboard/announcement']);
              this.notification.success(null, 'SMS_SENT');
            });
          }
          this.router.navigate(['/dashboard/announcement']);
        })
        .catch(err => {
          this.notification.error(null, err.error)
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private getRoles() {
    this.roleService.list()
      .toPromise()
      .then(roles => this.roles = _orderBy(roles, ['id'], ['asc']))
      .catch(err => this.notification.error(null, err.error));
  }

  private initEditor() {
    this.config = {
      placeholder: '',
      tabsize: 2,
      height: '300px',
      toolbar: [
          ['font', ['bold', 'italic', 'underline']],
          ['fontsize', ['fontname', 'fontsize', 'color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['insert', ['table', 'link']]
      ],
      fontNames: ['Helvetica', 'Arial']
    };
  }

  private initForm() {
    this.form = this.formBuilder.group({
      content: [null, Validators.required],
      expiration_date: null,
      priority: [null, Validators.required],
      is_signature_required: [null, Validators.required],
      is_sms: [null, Validators.required],
      permissions: [null, Validators.required],
      locations: null,
      title: [null, Validators.required]
    });
  }
}
