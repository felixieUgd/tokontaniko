import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MovingDirection, WizardComponent} from 'angular-archwizard';
import {Observable, Subscription} from 'rxjs';

import * as moment from 'moment';
import _isEqual from 'lodash.isequal';
import Facility from 'src/app/models/facility';
import Contact from 'src/app/models/contact';
import Category from 'src/app/models/category';

import {ContactService} from 'src/app/contact/contact.service';
import {AppService} from 'src/app/app.service';
import {MenService} from 'src/app/men/men.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {NgbDate} from '@ng-bootstrap/ng-bootstrap';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import {RequestType} from 'src/app/models/request';

@Component({
  selector: 'app-men-claim-register',
  templateUrl: './men-claim-register.component.html',
  styleUrls: ['./men-claim-register.component.css']
})
export class MenClaimRegisterComponent implements OnInit, OnDestroy {
  @ViewChild('wizard') wizard: WizardComponent;

  activeCategory: Category;
  causeCategories: Category[];
  effectCategories: Category[];
  facility: Facility;
  form: FormGroup;
  selectedStudent: Contact;
  subscriptions: Subscription[] = [];
  RequestContacts: Contact[] = [];

  minDate: any;
  submitted_accident: boolean;
  submitted_student: boolean;

  requestTypes: Observable<RequestType[]>;

  constructor(
    public menService: MenService,
    private appService: AppService,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private maintenanceService: MaintenanceService,
    private notification: NotificationService,
    private settingsCompanyService: SettingsCompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    const facility_id = this.route.snapshot.queryParams.facility;
    const contact_id = this.route.snapshot.queryParams.contact;
    this.minDate = this.appService.getMinDate();

    const interventionCategory = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_intervention_category');
    this.requestTypes = this.maintenanceService.getTypes({type: 'all'}, interventionCategory);

    this.getCategories();
    this.getFacility(facility_id);
    this.getContact(contact_id);
    this.initForm();
    this.valueChange();

    this.subscriptions.push(
      this.menService.sidePanelFacility.subscribe(
      (value:any) => {
        if (!value.status) {
          this.getFacility(facility_id);
        }
      }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(item => item.unsubscribe());
  }

  getContact(id) {
    if (id) {
      this.contactService.get(id).toPromise()
        .then(res => {
          this.selectedStudent = res;

          delete res.created_at;

          const value:any = Object.assign({}, res, {
            id: res.id,
            father: res.parent_id ? res.Parent : null,
            bio_dob: res.bio_dob ? new Date(res.bio_dob) : null,
            age: res.bio_dob ? moment().diff(moment(res.bio_dob), 'years', false) : null,
            grade: res.meta? res.meta.school_grade: null,
            meta: res.meta
          });

          this.Student.patchValue(value);
          this.RequestContacts.push({
            id: res.id,
            meta: {type: 'STUDENT'}
          })
        })
        .catch(err => this.notification.error(null, err.error));
    }
  }

  onExitStudent: (MovingDirection) => Promise<boolean> = (direction) => {
    if (direction === 1) {
      return this.proceed(true)
    }
    else {
      this.submitted_student = true;

      if (this.Student.valid) {
        const original = {
          name: this.selectedStudent.name,
          sex: this.selectedStudent.sex,
          grade: this.selectedStudent.meta? this.selectedStudent.meta.school_grade: null,
          bio_dob: this.selectedStudent.bio_dob,
          bio_pob: this.selectedStudent.bio_pob,
          parent: this.selectedStudent.Parent
        };

        const formValue = this.Student.getRawValue();
        const newValue = {
          name: formValue.name,
          grade: formValue.grade,
          sex: formValue.sex,
          bio_dob: formValue.bio_dob ? moment(formValue.bio_dob).format('YYYY-MM-DD') : null,
          bio_pob: formValue.bio_pob,
          parent: formValue.father || formValue.mother || formValue.tutor
        }

        if (_isEqual(original, newValue)) this.proceed(true);
        else {
          const body = Object.assign({}, this.selectedStudent, {
            name: newValue.name,
            sex: newValue.sex,
            bio_dob: newValue.bio_dob,
            bio_pob: newValue.bio_pob,
            parent_id: newValue.parent ? newValue.parent.id : null,
            meta: {...(this.selectedStudent.meta || {}), grade: newValue.grade}
          });

          this.contactService.update(body)
            .toPromise()
            .then(res => {
              this.proceed(true);
              console.log('Contact updated !');
            })
            .catch(err => this.notification.error(null, err.error));
        }

        return this.proceed(true);
      }
      else {
        this.notification.error(null, 'FORM_NOT_VALID');
      }
    }

    return this.proceed(false);
  }

  onRemoveContact(event, type) {
    const index = this.RequestContacts.findIndex(item => item.meta.type === type);
    if (index !== -1) this.RequestContacts.splice(index, 1);
  }

  onSelectContact(event, type) {
    if (event) {
      this.RequestContacts.push({
        id: event.id,
        meta: {type}
      });
    }
  }

  onSelectDob(event: NgbDate) {
    const bio_dob = moment().year(event.year).month(event.month-1).date(event.day).hour(9).minute(0).second(0);
    this.Student.patchValue({age: moment().diff(bio_dob, 'years', false)});
  }

  save() {
    this.submitted_accident = true;

    if (this.Accident.valid) {
      const formValue = this.form.getRawValue();
      const body: any = {
        Contacts: this.RequestContacts,
        Staffs: [
          {id: this.sessionService.getUser().id}
        ],
        category_id: this.activeCategory.id,
        category_name: this.activeCategory.name,
        comments: formValue.Accident.comments || formValue.Accident.other_comments,
        description: formValue.Accident.description,
        due_at: moment().format(),
        facility_id: this.facility.id,
        request_type_id: formValue.Accident.request_type_id,
        status: 'APPROVED',
        title: formValue.Accident.title || formValue.Accident.other_title,
        type: 'CLAIM',
        meta: {
          Accident: {
            delivered_at: formValue.Student.delivered_at,
            doc_number: formValue.Student.doc_number
          },
          Student: {
            school_grade: formValue.Student.grade,
            school_serial: formValue.Student.serial,
            school_insurance: formValue.Student.insurance
          }
        }
      };

      const event_time = formValue.Accident.event_start ? (formValue.Accident.event_start).split(':') : null;

      body.requested_at = formValue.Accident.requested_at || null;
      body.event_start = event_time ? moment().hours(+event_time[0]).minutes(+event_time[1]).format() : null;

      this.maintenanceService.create(body)
        .toPromise()
        .then(res => {
          this.router.navigate(['/men/claim/detail', res.id]);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(err, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateFacilityInfo() {
    this.menService.updateSidePanel({
      facility: this.facility,
      isOpen: true
    });
  }

  get Accident(): FormGroup {
    return this.form.get('Accident') as FormGroup;
  }

  get Student(): FormGroup {
    return this.form.get('Student') as FormGroup;
  }

  private getCategories() {
    this.categoryService.list({type: 'claim'})
      .toPromise()
      .then(res => {
        this.causeCategories = res.filter(item => /^C -/g.test(item.name));
        this.effectCategories = res.filter(item => /^E -/g.test(item.name));

        const searchResult = res.find(item => item.name === 'Sinistre');
        this.activeCategory = searchResult ? searchResult : null;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.form = this.formBuilder.group({
      Accident: this.formBuilder.group({
        description: [null, Validators.required],
        event_start: null,
        request_type: [null, Validators.required], //  Refer to menService accidentTypes
        requested_at: null, //  Date de l'accident
        requested_time: null,
        title: null,
        other_title: null,
        comments: null,
        request_type_id: null,
        other_comments: null,
        officer: null,
        warrant: null,
        witness: null
      }),
      Student: this.formBuilder.group({
        id: null,
        age: null,
        search: null,
        name: null,
        sex: null,
        bio_dob: null,
        bio_pob: null,
        //  Parents
        person_in_charge: 'PARENT',
        father: null,
        mother: null,
        tutor: null,
        //  Autres infos
        grade: null,
        serial: null,
        insurance: null,
        delivered_at: null,
        doc_number: null
      })
    });
  }

  private getFacility(id) {
    this.menService.search({id, action: 'search'})
      .then(res => {
        this.facility = res;
        this.facility.Contact = res.Contacts.length > 0 ? res.Contacts[0] : null;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private proceed(value: boolean): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      return resolve(value);
    });
  }

  private valueChange() {
    this.subscriptions.push(
      this.Student.get('person_in_charge').valueChanges.subscribe(value => {
        this.Student.patchValue({father:null, mother:null, tutor:null})
      })
    );
  }
}

/*
        const Contacts = [];
        if (formValue.Student) Contacts.push({id: formValue.Student.id, meta: {type: 'STUDENT'}});
        if (formValue.Student.father) Contacts.push({id: formValue.Student.father.id, meta: {type: 'FATHER'}});
        if (formValue.Student.mother) Contacts.push({id: formValue.Student.mother.id, meta: {type: 'MOTHER'}});
        if (formValue.Student.tutor) Contacts.push({id: formValue.Student.tutor.id, meta: {type: 'TUTOR'}});
        if (formValue.Accident.Witness) Contacts.push({id: formValue.Accident.Witness.id, meta: {type: 'WITNESS'}});
        if (formValue.Accident.Officer) Contacts.push({id: formValue.Accident.Officer.id, meta: {type: 'OFFICER'}});
        if (formValue.Accident.Warrant) Contacts.push({id: formValue.Accident.Warrant.id, meta: {type: 'WARRANT'}});

Officer: this.formBuilder.group({
          id: null,
          name: null,
          phone: '',
          rank: null,
          search: null,
          serial: null,
          worksite: null
        }),
        Witness: this.formBuilder.group({
          id: null,
          search: null,
          name: null,
          cin: '',
          cin_issued_date: null,
          cin_delivered_at: null,
          address: null,
          phone: ''
        }),
        Warrant: this.formBuilder.group({
          id: null,
          search: null,
          name: null,
          cin: '',
          cin_issued_date: null,
          cin_delivered_at: null,
          address: null,
          phone: ''
        })
         */
