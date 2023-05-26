import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {MenService} from 'src/app/men/men.service';
import Facility from 'src/app/models/facility';
import Geography from 'src/app/models/geograhy';
import {SettingsService} from 'src/app/settings/settings.service';
import {NotificationService} from 'src/app/_services/notification.service';

@Component({
  selector: 'app-side-panel-facility-add',
  templateUrl: './side-panel-facility-add.component.html',
  styleUrls: ['./side-panel-facility-add.component.css']
})
export class SidePanelFacilityAddComponent implements OnInit {

  facility?: Facility;
  facilityForm: FormGroup;

  communes: Geography[];

  loading: boolean;
  sidePanelOpen: boolean;
  submitted: boolean;

  subscription = new Subscription();
  types: any[];

  constructor(private formBuilder: FormBuilder,
    private menService: MenService,
    private settingsService: SettingsService,
    private notification: NotificationService) {
  }

  ngOnInit() {

    this.initForm();

    this.subscription.add(
      this.settingsService.sidePanelFacilityAdd$.subscribe((value: any) => {
        if (value.isOpen) {
          this.fetchFacilityTypes();

          if (!this.communes) {
            this.fetchCommunes();
          }

          if (value.facility) {
            this.facility = value.facility;
            this.facilityForm.patchValue(this.facility);
          }
          
          this.sidePanelOpen = true;
        }
        else {
          this.sidePanelOpen = false;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  close(isUpdated?: boolean) {
    this.facility = null;
    this.loading = false;
    this.submitted = false;

    this.facilityForm.reset({
      is_enabled: true,
      is_private: false
    });

    this.settingsService.updateSidePanelFacilityAdd({
      isOpen: false,
      isUpdated
    });
  }

  edit(facility: Facility) {
    this.facility = facility;
    this.facilityForm.patchValue(facility);
    this.sidePanelOpen = true;
  }

  save() {
    this.submitted = true;

    if (this.facilityForm.valid) {
      const formValue = this.facilityForm.getRawValue();

      if (this.facility) {
        const body = Object.assign({}, formValue, {id: this.facility.id});
        this.menService.update(this.facility.id, body)
          .then(res => {
            this.close(true);
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        this.menService.create(formValue)
          .then(res => {
            this.close(true);
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private fetchCommunes() {
    this.menService.getGeographies('CMN').then(communes => {
      this.communes = communes;
    }).catch(err => this.notification.error(null, err.error));
  }

  private fetchFacilityTypes() {
    this.menService.listType()
      .toPromise()
      .then(res => this.types = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.facilityForm = this.formBuilder.group({
      name: [null, Validators.required],
      code: [null, Validators.required],
      facility_type_id: null,
      geography_id: null,
      is_enabled: true,
      is_private: false
    });
  }

}
