import {Component, OnInit, ElementRef, OnDestroy} from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormArray, FormControl} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';

import {verifyPassword} from 'src/app/shared/directives/verify-password.directive';
import {FileUploader} from 'ng2-file-upload';
import * as moment from 'moment';
import _orderBy from 'lodash.orderby';
import _forEach from 'lodash.foreach';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {ContactPreviewComponent} from 'src/app/contact/contact-preview/contact-preview.component';
import Company from 'src/app/models/company';
import Position from 'src/app/models/position';
import Role from 'src/app/models/role';
import User from 'src/app/models/user';

import {AppService} from 'src/app/app.service';
import {HrPositionService} from 'src/app/hr/position/hr-position.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {RoleService} from 'src/app/settings/role/role.service';
import {SessionService} from 'src/app/_services/session.service';
import {SettingsCompanyService} from '../../company/settings-company.service';
import {UserService} from 'src/app/settings/user/user.service';
import {UserEventModalComponent} from '../user-event-modal/user-event-modal.component';
import BaseModel from 'src/app/models/base-model';
import {UtilityService} from 'src/app/_services/utility.service';
import {MenService} from 'src/app/men/men.service';
import Geography from 'src/app/models/geograhy';
import {Subscription} from 'rxjs';
import {AccountService} from 'src/app/accounting/account/account.service';

interface PickerListSelectedItem<T> {
  type: 'ADD' | 'REMOVE';
  value: T;
}

class UserScore extends BaseModel {
  average: number;
  contribution: number;
  note: number;
  offense: number;
}

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css', '../../../../assets/scss/plugins/_datepicker.scss']
})
export class UserEditComponent implements OnInit, OnDestroy {
  companies: Company[];
  passwordForm: FormGroup;
  permissionForm: FormGroup;
  positions: Position[];
  profileForm: FormGroup;
  roleForm: FormGroup;
  roles: Role[];
  score: UserScore;
  uploader: FileUploader;
  user: User;
  userForm: FormGroup;

  accountNumber: string;

  id: number;

  loginToken: String;
  marital_statuses: any[];
  minDate: any;
  submitted: boolean;
  submittedPassword: boolean;
  submittedProfile: boolean;
  Selected: PickerListSelectedItem<Company>;
  SelectedGeography: PickerListSelectedItem<Geography>;

  subscription: Subscription;

  selectedType: 'DST' | 'RGN' | 'CMN' = 'RGN';
  searchSelected: string;
  searchAvailable: string;
  availableGeographies: Geography[];
  selectedGeographies: Geography[];

  activeMenu: any;

  constructor(
    private appService: AppService,
    private elementRef: ElementRef,
    private formBuilder: FormBuilder,
    private hrPositionService: HrPositionService,
    private modalService: NgbModal,
    private notification: NotificationService,
    private printService: PrintService,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private settingsCompanyService: SettingsCompanyService,
    private sessionService: SessionService,
    private userService: UserService,
    private utilityService: UtilityService,
    public menService: MenService
  ) { }

  ngOnInit() {
    this.loginToken = this.sessionService.getToken();
    this.marital_statuses = this.appService.marital_statuses;
    this.minDate = this.appService.getMinDate();
    this.activeMenu = this.sessionService.getActiveMenu();

    this.subscription = this.route.paramMap.subscribe(param => {
      this.id = +param.get('id');
      this.init();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  addAll() {
    this.user.Companies = this.companies.concat(this.user.Companies);
    this.companies.length = 0;
  }

  addAllGeography() {
    this.selectedGeographies = this.availableGeographies.concat(this.selectedGeographies);
    this.availableGeographies.length = 0;
  }

  addRemove() {
    if (!this.Selected) {
      this.notification.error(null, 'NO_ELEMENT_SELECTED');
      return;
    }

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

  addRemoveGeography() {
    if (!this.SelectedGeography) {
      this.notification.error(null, 'NO_ELEMENT_SELECTED');
      return;
    }

    if (this.SelectedGeography.type === 'ADD') {
      const index = this.availableGeographies.findIndex(item => item.id === this.SelectedGeography.value.id);

      this.availableGeographies.splice(index, 1);
      this.selectedGeographies.push(this.SelectedGeography.value);
    }
    else {
      const index = this.selectedGeographies.findIndex(item => item.id === this.SelectedGeography.value.id);

      this.selectedGeographies.splice(index, 1);
      this.availableGeographies.push(this.SelectedGeography.value);
    }

    this.SelectedGeography = null;
  }

  clearAll() {
    this.companies = this.companies.concat(this.user.Companies);
    this.user.Companies.length = 0;
  }

  clearAllGeography() {
    this.availableGeographies = this.selectedGeographies.concat(this.availableGeographies);
    this.selectedGeographies.length = 0;
  }

  changeGeographyType(event: any) {
    this.searchAvailable = '';
    this.searchSelected = '';

    setTimeout(() => {
      this.getGeographies();
    }, 0)
  }

  createAccount() {
    const formValue = this.profileForm.getRawValue();
    this.accountService.create({
      name: this.user.name,
      number: this.accountNumber,
      currency_code: 'MGA',
      enabled: true
    })
    .toPromise()
    .then(account => {
      return this.userService.updateProfile(this.user.id, {
        Profile: {
          custom_fields: {
            ...formValue.custom_fields,
            account_id: account.id
          }
        }
      })
      .then(profile => {
        this.notification.success(null, 'SAVE_SUCCESS');
        this.reset();
      })

    })
    .catch(err => this.notification.error(null, err.error));
  }

  deleteAttachment(docId) {
    this.userService.deleteAttachment(this.user.id, docId)
      .then(() => {
        this.reset();
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  filterGeography(data: Geography[], keyword: string) {
    if (!keyword) {
      return data || [];
    }

    return data ? data.filter(item => item.name.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) : [];
  }

  getUserPhoto() {
    return this.user ? this.user.photo : '';
  }

  onSelect(item, type) {
    this.Selected = {
      type,
      value: item
    };
  }

  onSelectGeography(item: Geography, type: any) {
    this.SelectedGeography = {
      type,
      value: item
    };
  }

  openEventModal() {
    const modalRef = this.modalService.open(UserEventModalComponent, {size: 'sm'});
    modalRef.componentInstance.user = this.user;

    modalRef.result
      .then(res => {
        if (res) this.reset();
      })
      .catch(err => console.log(err));
  }

  preview(idPhoto, type?: string) {
    if (idPhoto) {
      const modalRef = this.modalService.open(ContactPreviewComponent, {size: 'lg', windowClass: 'img-preview'});
      modalRef.componentInstance.idPhoto = idPhoto;
      modalRef.componentInstance.type = type ? type : 'documents';
    }
    else {
      this.notification.warning(null, 'FILE_NOT_FOUND');
    }
  }

  async printBadge() {
    const el = this.elementRef.nativeElement as HTMLElement;
    const url = el.getElementsByClassName('pdp')[0]['src'];
    const blob = await fetch(url).then(r => r.blob());
    const reader = new FileReader();
    const user: any = Object.assign({}, this.user);

    reader.readAsDataURL(blob);
    reader.onload = function () {
      user.photo64 = reader.result;
    };

    setTimeout(() => {
      this.printService.badge(user, 'bg_capsule.jpg');
    }, 500);
  }

  reset() {
    this.submitted = false;
    this.submittedPassword = false;
    this.submittedProfile = false;

    this.userForm.reset();
    this.profileForm.reset();
    this.passwordForm.reset();

    this.resetScore();
    this.getUser();
  }

  save() {
    this.submitted = true;

    if (this.userForm.valid) {
      const user = new User({
        id: this.user.id,
        name: this.userForm.controls['name'].value,
        email: this.userForm.controls['email'].value,
        enabled: this.userForm.controls['enabled'].value,
        Companies: this.user.Companies
      });

      this.userService.update(user)
        .toPromise()
        .then(res => {
          this.reset();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateGeography() {
    this.userService.updateGeography(this.user.id, {Geographies: this.selectedGeographies}).then(() => {
      this.notification.success(null, 'UPDATE_SUCCESS');
    }).catch(err => this.notification.error(null, err.error));
  }

  updateRole() {
    const user = new User({
      id: this.user.id,
      Roles: this.fgToObject(this.roles, this.roleForm.controls['Roles'].value)
    });

    this.userService.updateRole(user)
      .toPromise()
      .then(res => {
        this.reset();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  updatePassword() {
    this.submittedPassword = true;

    if (this.passwordForm.valid) {
      const body = {
        password: this.passwordForm.get('password').value
      };

      this.userService.updatePassword(this.user.id, body)
        .toPromise()
        .then(res => {
          this.reset();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateProfile() {
    this.submittedProfile = true;

    if (this.profileForm.valid) {
      const formValue = this.profileForm.getRawValue();
      const body = {
        Profile: Object.assign({}, formValue, {
          user_id: this.user.id,
          position_id: formValue.position.id
        })
      };

      this.userService.updateProfile(this.user.id, body)
        .then(res => {
          this.reset();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));

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
        this.user.Companies = _orderBy(
          this.user.Companies.map(elem => {
            const index = this.companies.findIndex(item => item.id === elem.id);

            if (index !== -1) {
              const value = this.companies[index];

              this.companies.splice(index, 1);

              return value;
            }

            return elem;
          }),
          ['company_name'],
          ['asc']
        );
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getGeographies() {
    this.selectedGeographies = this.user.Geographies.filter(geography => geography.type === this.selectedType);
    this.menService.getGeographies(this.selectedType).then(geographies => {
      this.availableGeographies = geographies.filter(geography => !this.selectedGeographies.find(selected => selected.id === geography.id));
    }).catch(err => {
      this.notification.error(null, err.error);
    });
  }

  private getPositions() {
    this.hrPositionService.list()
      .then(res => {
        this.positions = res;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getRoles() {
    this.roleService.list()
      .toPromise()
      .then(res => {
        this.roles = res;
        this.initCheckbox(res, this.user.Roles, this.roleForm, 'Roles');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private init() {
    this.submitted = false;
    this.submittedPassword = false;

    this.resetScore();
    this.initPasswordForm();
    this.initProfileForm();
    this.initRoleForm();
    this.initUserForm();
    this.initUploader();
    this.getPositions();
    this.getUser();
  }

  private setScore(user: User): void {
    if (user.Profile) {
      let count = 0;

      user.Profile.ProfileEvents.forEach(item => {
        this.score.note += item.type === 'NOTE' ? item.score : 0;

        if (item.type === 'CONTRIBUTION') {
          this.score.contribution += item.score;
          count++;
        }
        else if (item.type === 'OFFENSE') {
          this.score.offense += item.score;
          count++;
        }
      });

      const total = this.score.offense + this.score.contribution;
      this.score.average = total > 0 ? +(total / count).toFixed(1) : 0;
    }
    else this.notification.error(null, 'PROFILE_NOT_SET');
  }

  private getUser() {
    this.userService.get(this.id)
      .toPromise()
      .then(res => {
        this.user = new User(res);
        this.userForm.patchValue({
          name: res.name,
          email: res.email,
          enabled: res.enabled
        });

        this.initCustomFields(this.profileForm.get('custom_fields') as FormGroup, res.Profile);

        this.profileForm.patchValue(Object.assign({}, res.Profile, {
          bio_dob: (res.Profile && res.Profile.bio_dob) ? moment(res.Profile.bio_dob).toDate() : null,
          date_hire: (res.Profile && res.Profile.date_hire) ? moment(res.Profile.date_hire).toDate() : null,
          date_termination: (res.Profile && res.Profile.date_termination) ? moment(res.Profile.date_termination).toDate() : null,
          position: res.Profile ? res.Profile.Position : null
        }));

        this.setScore(this.user);
        this.getCompanies();
        this.getRoles();

        if (this.activeMenu && ((this.activeMenu.men && this.activeMenu.men.root) || (this.activeMenu.inventory && this.activeMenu.inventory.root))) {
          this.getGeographies();
        }
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initCheckbox(_data: any[], _user_data: any[], _form: FormGroup, _control: string) {
    const group = {};

    for (let i = 0; i < _data.length; i++) {
      const elem = _data[i];
      group[elem.id] = false;

      _forEach(_user_data, item => {
        if (elem.id === item.id) {
          group[elem.id] = true;
        }
      });
    }

    const FGp = this.formBuilder.group(group);
    _form.setControl(_control, FGp);
  }

  private initCustomFields(formGroup: FormGroup, profile: any) {
    if (profile) {
      const custom_fields = profile.Position ? profile.Position.custom_fields : null;

      if (custom_fields) {
        custom_fields.forEach(item => {
          formGroup.addControl(item.key, new FormControl(null));
        });
      }
    }
  }

  private initUploader() {
    this.uploader = new FileUploader({
      url: this.utilityService.getUploadUrl(this.id, 'USER'),
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
      this.init();
      this.notification.success(null, 'UPLOAD_SUCCESS');
    };
  }

  private initPasswordForm() {
    this.passwordForm = this.formBuilder.group({
      password: [null, [Validators.required, Validators.pattern(/(?=^.{8,}$)(?=.*\d)(?=.*[A-Za-z\d]).*$/)]],
      passwordConfirm: [null, Validators.required]
    }, {validator: verifyPassword});
  }

  private initProfileForm(customFields?) {
    this.profileForm = this.formBuilder.group({
      address: null,
      id: null,
      bio_dob: null,
      bio_nationality: null,
      bio_pob: null,
      custom_fields: this.formBuilder.group({}),
      date_hire: null,
      date_termination: null,
      doc_name: null,
      id_cin: null,
      id_driver_license: null,
      id_other: null,
      id_passport: null,
      marital_status: [null, Validators.required],
      note: null,
      position: [null, Validators.required],
      phone_primary: [null, Validators.required],
      phone_work: [null, Validators.required],
      salary: null,
      sex: null
    });
  }

  private initRoleForm() {
    this.roleForm = this.formBuilder.group({
      Roles: this.formBuilder.group({})
    });
  }

  private initUserForm() {
    this.userForm = this.formBuilder.group({
      id: '',
      name: ['', Validators.required],
      email: ['', Validators.required],
      enabled: true
    });
  }

  private fgToObject(array: (Role[] | Company[]), values: Object) {
    const new_values = [];

    for (const key in values) {
      if (values.hasOwnProperty(key)) {
        _forEach(array, elem => {
          if (elem.id.toString() === key && values[key] === true) {
            new_values.push(elem);
          }
        });
      }
    }

    return new_values;
  }

  private resetScore() {
    this.score = new UserScore({
      average: 0,
      contribution: 0,
      note: 0,
      offense: 0
    });
  }
}
