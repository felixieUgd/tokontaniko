import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CategoryService} from 'src/app/accounting/category/category.service';
import Category from 'src/app/models/category';
import {RequestStatus} from 'src/app/models/request';
import {NotificationService} from 'src/app/_services/notification.service';
import {MaintenanceService} from '../../maintenance.service';

@Component({
  selector: 'app-maintenance-extended-status',
  templateUrl: './maintenance-extended-status.component.html',
  styleUrls: ['./maintenance-extended-status.component.css']
})
export class MaintenanceExtendedStatusComponent implements OnInit {

  statusForm: FormGroup;
  extendedStatuses: RequestStatus[];
  categories: Category[] = [];
  extendedStatus;
  sidePanelOpen;
  submitted;

  constructor(
    private maintenanceService: MaintenanceService,
    private formBuilder: FormBuilder,
    private categoryService: CategoryService,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.initForm();
    this.getExtendedStatuses();
  }

  edit(status: RequestStatus) {
    this.sidePanelOpen = true;

    this.extendedStatus = status;
    this.statusForm.patchValue(status);
  }

  open() {
    this.sidePanelOpen = true;
    this.extendedStatus = null;
    this.initForm();
  }

  save() {
    this.submitted = true;

    if (this.statusForm.valid) {
      const status: RequestStatus = new RequestStatus(this.statusForm.value);

      if (this.extendedStatus) {
        this.update(status);
      }
      else {
        this.create(status);
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private create(extendedStatus: RequestStatus) {
    this.maintenanceService.createExtendedStatus(extendedStatus)
      .toPromise()
      .then(res => {
        this.reset();
        this.notification.success(null, 'SAVE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private getExtendedStatuses() {
    this.categoryService.list({type: 'all'}).toPromise().then(categories => {
      this.categories = categories;
      return this.maintenanceService.listStatus()
        .toPromise()
        .then(statuses => {
          this.extendedStatuses = statuses.map(status => {
            if (status.category_id) {
              status.Category = this.categories.find(cat => cat.id === status.category_id);
            }

            return status;
          });
        })

    }).catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.statusForm = this.formBuilder.group({
      id: '',
      name: ['', Validators.required],
      description: '',
      category_id: null,
      enabled: [true, Validators.required]
    });
  }

  private update(status: RequestStatus) {
    this.maintenanceService.updateExtendedStatus(status.id, status)
      .toPromise()
      .then(res => {
        this.reset();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private reset() {
    this.extendedStatuses.length = 0;
    this.submitted = false;
    this.sidePanelOpen = false;
    this.statusForm.reset({
      enabled: true
    });

    this.getExtendedStatuses();
  }

}
