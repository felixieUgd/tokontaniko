import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {FileUploader} from 'ng2-file-upload';

import Company from 'src/app/models/company';

import _orderBy from 'lodash.orderby';

import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {SettingsCompanyService} from '../company/settings-company.service';
import {UtilityService} from 'src/app/_services/utility.service';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {
  companyForm: FormGroup;
  company: Company;
  uploader: FileUploader;
  configForm: FormGroup;

  activeMenu: any;

  companyId;
  Selected;
  submitted = false;
  sidePanelOpen = false;

  constructor(
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private sessionService: SessionService,
    private settingsCompanyService: SettingsCompanyService,
    private utilityService: UtilityService
  ) {}

  ngOnInit() {
    const user = this.sessionService.getUser();
    this.activeMenu = user.activeMenu && user.activeMenu.length ? user.activeMenu[0] : {};

    this.initForm();
  }

  onSelect(item, type) {
    this.Selected = {
      type,
      value: item
    };
  }

  updateGeneral() {
    this.submitted = true;

    if (this.companyForm.valid) {
      const formValues = this.companyForm.getRawValue();
      const company: Company = new Company({
        enabled: formValues.enabled,
        Settings: {
          'general.company_name': formValues.company_name,
          'general.company_email': formValues.company_email,
          'general.company_phone': formValues.company_phone,
          'general.company_NIF': formValues.company_NIF,
          'general.company_STAT': formValues.company_STAT,
          'general.company_address_line_1': formValues.company_address_line_1,
          'general.company_address_line_2': formValues.company_address_line_2
        }
      });

      this.settingsCompanyService.update(company)
        .toPromise()
        .then(res => {
          this.refreshData();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          this.notification.error(null, err);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  uploadFile() {
    this.uploader = new FileUploader({
      url: this.utilityService.getUploadUrl('logo', 'COMPANY'),
      method: 'POST',
      headers: [
        {name: 'X-Access-Token', value: this.sessionService.getToken()}
      ],
      autoUpload: true
    });
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader.onSuccessItem = (file, response, status, header) => {
      this.refreshData();
      this.notification.success(null, 'UPLOAD_SUCCESS');
    };
  }

  private getGeneral() {
    this.settingsCompanyService.get(this.companyId)
      .toPromise()
      .then(company => {
        this.company = company;
        this.companyForm.patchValue(Object.assign({}, company, {
          enabled: company.enabled,
          company_name: company.Settings['general.company_name'],
          company_email: company.Settings['general.company_email'],
          company_phone: company.Settings['general.company_phone'],
          company_NIF: company.Settings['general.company_NIF'],
          company_STAT: company.Settings['general.company_STAT'],
          company_address_line_1: company.Settings['general.company_address_line_1'],
          company_address_line_2: company.Settings['general.company_address_line_2']
        }));
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.companyId = this.sessionService.getCompanyId();

    this.companyForm = this.formBuilder.group({
      enabled: true,
      company_logo: null,
      company_name: [null, Validators.required],
      company_email: null,
      company_phone: [null, Validators.required],
      company_NIF: null,
      company_STAT: null,
      company_address_line_1: null,
      company_address_line_2: null
    });

    this.getGeneral();
  }

  private refreshData() {
    this.submitted = false;
    this.Selected = null;

    this.companyForm.reset();
    this.getGeneral();
  }
}
