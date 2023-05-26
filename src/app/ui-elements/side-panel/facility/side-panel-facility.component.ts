import { Component, OnDestroy, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import Facility from 'src/app/models/facility';
import {NotificationService} from 'src/app/_services/notification.service';
import {MenService} from 'src/app/men/men.service';

@Component({
  selector: 'app-side-panel-facility',
  templateUrl: './side-panel-facility.component.html',
  styleUrls: []
})
export class SidePanelFacilityComponent implements OnInit, OnDestroy {
  facility: Facility;
  form: FormGroup;
  subscription: Subscription;

  isOpen: boolean;
  submitted: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private menService: MenService,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.subscription = this.menService.sidePanelFacility.subscribe((value: any) => {
      if (value.isOpen && value.facility) {
        this.facility = value.facility;
        this.form.patchValue({
          address: value.facility.meta ? value.facility.meta.address : null,
          contact: value.facility.Contact,
          contact_serial: value.facility.meta ? value.facility.meta.contact_serial : null,
          contact_grade: value.facility.meta ? value.facility.meta.contact_grade : null
        });
        this.isOpen = true;
      }
      else {
        this.isOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  close() {
    this.menService.updateSidePanel({
      facility: null,
      status: false
    });
  }

  update() {
    this.submitted = true;

    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      delete this.facility.facility_type_id;
      const body = Object.assign({}, this.facility, {
        contact_id: formValue.contact ? formValue.contact.id : null,
        meta: {
          address: formValue.address,
          contact_serial: formValue.contact_serial,
          contact_grade: formValue.contact_grade
        }
      });

      this.menService.update(this.facility.id, body)
        .then(res => {
          this.close();
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

  private initForm() {
    this.form = this.formBuilder.group({
      address: null,
      contact: [null, Validators.required],
      contact_serial: null,
      contact_grade: null
    });
  }

}
