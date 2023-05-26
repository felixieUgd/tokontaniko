import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import _orderBy from 'lodash.orderby';

import Role from 'src/app/models/role';

import {AppService} from 'src/app/app.service';
import {DashboardService} from '../../dashboard.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {RoleService} from 'src/app/settings/role/role.service';
import {SessionService} from 'src/app/_services/session.service';
import {ImageService} from 'src/app/_services/image.service';

@Component({
  selector: 'app-dashboard-announcement-detail',
  templateUrl: './dashboard-announcement-detail.component.html',
  styleUrls: ['./dashboard-announcement-detail.component.css']
})
export class DashboardAnnouncementDetailComponent implements OnInit {
  form: FormGroup;
  roles: Role[];

  Announcement: any;
  config: any;
  minDate: any;
  submitted: boolean;

  constructor(
    public imageService: ImageService,
    private appService: AppService,
    private dashboardService: DashboardService,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.minDate = this.appService.getCurrentDate();

    this.initEditor();
    this.initForm();
    this.getRoles();
    this.getAnnouncement(id);
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

      this.dashboardService.updateAnnouncement(this.Announcement.id, body)
        .then(res => {
          this.notification.success(null, 'UPDATE_SUCCESS');
          this.router.navigate(['/dashboard/announcement']);
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private getAnnouncement(id) {
    this.dashboardService.getAnnouncement(id)
      .then(res => {
        this.Announcement = res;

        this.form.patchValue(Object.assign(
          {},
          this.Announcement,
          {
            expiration_date: new Date(this.Announcement.expiration_date)
          }
        ));
      })
      .catch(err => this.notification.error(null, err.error));
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
      expiration_date: [null, Validators.required],
      priority: [null, Validators.required],
      is_signature_required: [null, Validators.required],
      permissions: [null, Validators.required],
      locations: null,
      title: [null, Validators.required]
    });
  }
}
