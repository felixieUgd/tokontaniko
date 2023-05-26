import { Component, OnDestroy, OnInit } from '@angular/core';
import {Subscription} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import _forEach from 'lodash.foreach';

import Contact from 'src/app/models/contact';
import {SCHOOL_GRADES} from 'src/app/shared/config/men.config';

import {AppService} from 'src/app/app.service';
import {ContactService} from 'src/app/contact/contact.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SharedService} from 'src/app/_services/shared.service';

@Component({
  selector: 'app-side-panel-contact',
  templateUrl: './side-panel-contact.component.html',
  styleUrls: ['./side-panel-contact.component.css']
})
export class SidePanelContactComponent implements OnInit, OnDestroy {
  contactForm: FormGroup;

  school_grades: Array<any>;
  sidePanelOpen: boolean;
  submitted: boolean;

  subscriptions = new Array<Subscription>();

  constructor(
    public appService: AppService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.school_grades = SCHOOL_GRADES;

    this.initForm();
    this.subscribe();
  }

  closeSidePanel(created?: Contact) {
    this.sharedService.assignContact(created);
    this.sharedService.updateSidePanel(false);
  }

  save() {
    this.submitted = true;

    if (this.contactForm.valid) {
      const formValue = this.contactForm.getRawValue();

      _forEach(formValue.meta, (value, key) => {
        if (!value) delete formValue.meta[key];
      });

      const body = new Contact(formValue);

      this.contactService.create(body)
        .toPromise()
        .then((res) => {
          this.submitted = false;
          this.closeSidePanel(res);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  ngOnDestroy(): void {
    if (this.subscriptions && this.subscriptions.length) {
      this.subscriptions.forEach(item => item.unsubscribe());
    }
  }

  get Meta(): FormGroup {
    return this.contactForm.get('meta') as FormGroup;
  }

  private initForm() {
    this.contactForm = this.formBuilder.group({
      bio_dob: null,
      bio_pob: null,
      name: [null, Validators.required],
      email: null,
      currency_code: ['MGA', Validators.required],
      phone: null,
      sex: null,
      id_cin: null,
      id_passport: null,
      is_foreigner: false,
      is_business: false,
      address: null,
      meta: this.formBuilder.group({
        contact_type: null, //  UI purpose only
        id_cin_issued_date: null,
        id_cin_issued_place: null,
        name: null,
        phone: null,
        school_serial: null,
        officer_serial: null,
        officer_rank: null,
        officer_worksite: null,
        professor_serial: null,
        professor_rank: null,
        school_grade: null
      })
    });
  }

  private subscribe() {
    this.subscriptions.push(
      this.sharedService.sidePanel$.subscribe(sub => {
        this.contactForm.reset({
          currency_code: 'MGA',
          is_business: false,
          is_foreigner: false
        });
        this.sidePanelOpen = sub;
      })
    );

    this.subscriptions.push(
      this.sharedService.contactCreate$.subscribe(sub => {
        if (sub) {
          this.contactForm.patchValue(sub);
        }
      })
    );

    this.subscriptions.push(
      this.contactForm.get('is_foreigner').valueChanges.subscribe(value => {
        this.contactForm.patchValue({
          id_cin: null,
          id_passport: null
        });

        this.Meta.patchValue({
          id_cin_issued_date: null,
          id_cin_issued_place: null
        });
      })
    );
  }

}
