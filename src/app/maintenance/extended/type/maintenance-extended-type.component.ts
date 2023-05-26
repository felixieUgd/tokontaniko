import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {CategoryService} from 'src/app/accounting/category/category.service';
import Category from 'src/app/models/category';
import {RequestType} from 'src/app/models/request';
import {NotificationService} from 'src/app/_services/notification.service';
import {MaintenanceService} from '../../maintenance.service';

@Component({
  selector: 'app-maintenance-extended-type',
  templateUrl: './maintenance-extended-type.component.html',
  styleUrls: ['./maintenance-extended-type.component.css']
})
export class MaintenanceExtendedTypeComponent implements OnInit {

  typeForm: FormGroup;
  extendedTypes: RequestType[];
  extendedType;
  sidePanelOpen;
  submitted;

  categories: Category[] = [];

  constructor(
    private maintenanceService: MaintenanceService,
    private formBuilder: FormBuilder,
    private categoryService: CategoryService,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.initForm();
    this.getExtendedTypes();
  }

  edit(type: RequestType) {
    this.sidePanelOpen = true;

    this.extendedType = type;
    this.typeForm.patchValue(type);
  }

  open() {
    this.sidePanelOpen = true;
    this.extendedType = null;
    this.initForm();
  }

  save() {
    this.submitted = true;

    if (this.typeForm.valid) {
      const type: RequestType = new RequestType(this.typeForm.value);

      if (this.extendedType) {
        this.update(type);
      }
      else {
        this.create(type);
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private create(extendedType: RequestType) {
    this.maintenanceService.createExtendedType(extendedType)
      .toPromise()
      .then(res => {
        this.reset();
        this.notification.success(null, 'SAVE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private getExtendedTypes() {
    this.categoryService.list({type: 'all'}).toPromise().then(categories => {
      this.categories = categories;
      return this.maintenanceService.getTypes({type: 'all'})
        .toPromise()
        .then(types => {
          this.extendedTypes = types.map(type => {
            if (type.category_id) {
              type.Category = this.categories.find(cat => cat.id === type.category_id);
            }

            return type;
          });
        })
        
    }).catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.typeForm = this.formBuilder.group({
      id: '',
      name: ['', Validators.required],
      description: '',
      category_id: null,
      enabled: [true, Validators.required]
    });
  }

  private update(type: RequestType) {
    this.maintenanceService.updateExtendedType(type.id, type)
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
    this.extendedTypes.length = 0;
    this.submitted = false;
    this.sidePanelOpen = false;
    this.typeForm.reset({
      enabled: true
    });

    this.getExtendedTypes();
  }

}
