import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import _orderBy from 'lodash.orderby';
import {verifyPassword} from 'src/app/shared/directives/verify-password.directive';

import Role from 'src/app/models/role';
import User from 'src/app/models/user';
import Company from 'src/app/models/company';

import {NotificationService} from 'src/app/_services/notification.service';
import {UserService} from 'src/app/settings/user/user.service';
import {SettingsCompanyService} from '../../company/settings-company.service';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-user-add',
  templateUrl: './user-add.component.html'
})
export class UserAddComponent implements OnInit {
  roles: Role[];
  companies: Company[];
  user: User;
  userForm: FormGroup;

  Selected: any;
  submitted: boolean;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private userService: UserService,
              private settingsCompanyService: SettingsCompanyService,
              private notification: NotificationService) {
  }

  ngOnInit() {
    this.submitted = false;
    this.user = new User({
      Companies: []
    });

    this.initUserForm();
    this.getCompanies();
  }

  addAll() {
    this.user.Companies = this.companies.concat(this.user.Companies);
    this.companies.length = 0;
  }

  addRemove() {
    if (this.Selected.type === 'ADD') {
      const index = this.companies.findIndex(item => item.id === this.Selected.value.id);

      this.companies.splice(index, 1);
      this.user.Companies.push(this.Selected.value);
    }
    else {
      const index = this.user.Companies.findIndex(item => item.id === this.Selected.value.id);

      this.user.Companies.splice(index, 1);
      this.companies.push(this.Selected.value);
    }

    this.Selected = null;
  }

  clearAll() {
    this.companies = this.companies.concat(this.user.Companies);
    this.user.Companies.length = 0;
  }

  importUser(event: any) {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = async () => {
      try {
        const arrayBuffer = fileReader.result as ArrayBuffer;
        let data = new Uint8Array(arrayBuffer);
        let arr = new Array();
        for(let i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
        let bstr = arr.join('');
        let workbook = XLSX.read(bstr, {type: 'binary'});
        let first_sheet_name = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[first_sheet_name];
        let json = XLSX.utils.sheet_to_json(worksheet, {raw: true}) as any[];

        if (json) {
          for(let item of json ) {
            if (item.Status === 'Active') {
              const name = (item.Name as string).replace(/[^\w ]/g, '').trim();
              const split = name.toLowerCase().split(' ');
              const length = split.length;
              const suffix = '@mail.com';

              let email = '';
              if (length > 1) {
                email = [split[0], split[length - 1]].join('.');
              }
              else {
                email = split[0];
              }

              email += suffix;

              const user = new User({
                name: name.replace(
                  /\w\S*/g,
                  function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
                  }
                ),
                email,
                password: 'Letmein2022',
                Companies: [{id: 1}]
              });

              await this.userService.create(user)
                .then(res => {
                  this.router.navigate(['/settings/user/edit/', res.id]);
                  this.notification.success(null, 'SAVE_SUCCESS');
                })
                .catch(err => {
                  this.notification.error(null, err.error);
                  }
                );
            }
          }
        }
      }
      catch(err) {
        console.log(err);
      }
    }
    fileReader.onerror = (error) => {
      console.log(error);
    }
  }

  onSelect(item, type) {
    this.Selected = {
      type,
      value: item
    };
  }

  save() {
    this.submitted = true;

    if (this.userForm.valid) {
      if (this.user.Companies.length > 0) {
        const formValue = this.userForm.getRawValue();
        const user = new User({
          name: formValue.name,
          email: formValue.email,
          password: formValue.password,
          Companies: this.user.Companies,
          enabled: formValue.enabled
        });

        this.userService.create(user)
          .then(res => {
            this.router.navigate(['/settings/user/edit/', res.id]);
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => {
            this.notification.error(null, err.error);
        });
      }
      else {
        this.notification.error(null, 'SELECT_COMPANY');
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private getCompanies() {
    this.settingsCompanyService.list(true)
      .toPromise()
      .then(res => {
        this.companies = _orderBy(res, ['company_name'], ['asc']);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initUserForm() {
    this.userForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', [Validators.required, Validators.pattern(/(?=^.{8,}$)(?=.*\d)(?=.*[A-Za-z\d]).*$/)]],
      passwordConfirm: ['', Validators.required],
      enabled: true
    }, {validator: verifyPassword});
  }
}
