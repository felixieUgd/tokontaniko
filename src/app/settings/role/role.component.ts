import {Component, OnInit} from '@angular/core';
import {FormGroup, Validators, FormBuilder} from '@angular/forms';

import _orderBy from 'lodash.orderby';

import {NotificationService} from 'src/app/_services/notification.service';
import {RoleService} from './role.service';

import Role from 'src/app/models/role';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html'
})
export class RoleComponent implements OnInit {
  role: Role;
  roleForm: FormGroup;
  roles: Role[];

  sidePanelOpen: boolean;
  submitted: boolean;

  constructor(private formBuilder: FormBuilder,
    private roleService: RoleService,
    private notification: NotificationService) {
  }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.initForm();
    this.fetchRoles();
  }

  open() {
    this.sidePanelOpen = true;
    this.role = null;

    this.roleForm.reset();
  }

  save() {
    this.submitted = true;

    if (this.roleForm.valid) {
      const role = new Role(this.roleForm.value);

      this.roleService.create(role)
        .toPromise()
        .then(res => {
          this.submitted = false;
          this.sidePanelOpen = false;

          this.fetchRoles();
          this.roleForm.reset();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private fetchRoles() {
    this.roleService.list()
      .toPromise()
      .then(roles => this.roles = _orderBy(roles, ['id'], ['asc']))
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.roleForm = this.formBuilder.group({
      name: ['', Validators.required],
      display_name: ['', Validators.required],
      description: ''
    });
  }

}
