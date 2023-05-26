import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MenService} from 'src/app/men/men.service';
import {NotificationService} from 'src/app/_services/notification.service';

@Component({
  selector: 'app-settings-structure-facility-type',
  templateUrl: './settings-structure-facility-type.component.html',
  styleUrls: ['./settings-structure-facility-type.component.css']
})
export class SettingsStructureFacilityTypeComponent implements OnInit {

  typeForm: FormGroup;
  types: any[];
  Type: any;

  sidePanelOpen: boolean;
  submitted: boolean;

  constructor(private formBuilder: FormBuilder,
    private menService: MenService,
    private notification: NotificationService) {
  }

  ngOnInit() {
    this.initForm();
    this.fetchFacilityTypes();
  }

  close() {
    this.Type = null;
    this.sidePanelOpen = false;
    this.submitted = false;
    this.typeForm.reset({
      enabled: true
    });
  }

  edit(id) {
    this.sidePanelOpen = true;
    this.typeForm.reset();

    this.menService.getType(id)
      .then(res => {
        this.Type = res;
        this.typeForm.patchValue(res);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  open() {
    this.sidePanelOpen = true;
    this.Type = null;
  }

  save() {
    this.submitted = true;

    if (this.typeForm.valid) {
      if (this.Type) {
        this.update();
      }
      else {
        this.create();
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private create() {
    const type = this.typeForm.value;

    this.menService.createType(type)
      .then(res => {
        this.ngOnInit();
        this.notification.success(null, 'SAVE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private fetchFacilityTypes() {
    this.menService.listType()
      .toPromise()
      .then(res => this.types = res)
      .catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.sidePanelOpen = false;
    this.submitted = false;
    this.typeForm = this.formBuilder.group({
      name: ['', Validators.required],
    });
  }

  private update() {
    const type = this.typeForm.value;

    this.menService.updateType(this.Type.id, type)
      .then(res => {
        this.ngOnInit();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

}
