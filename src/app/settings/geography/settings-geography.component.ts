import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {of, SmartTable} from 'smart-table-ng';
import Geography from 'src/app/models/geograhy';
import {GEOGRAPHY_TYPES} from 'src/app/shared/config/men.config';
import {NotificationService} from 'src/app/_services/notification.service';
import {SettingsGeographyService} from './settings-geography.service';

@Component({
  selector: 'app-settings-geography',
  templateUrl: './settings-geography.component.html',
  styleUrls: ['./settings-geography.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: () => of([])
  }]
})
export class SettingsGeographyComponent implements OnInit {

  types = ['RGN', 'DST', 'CMN'];
  
  selectedType = this.types[0];
  geography?: Geography;
  geographyForm: FormGroup;

  loading: boolean;
  sidePanelOpen: boolean;
  submitted: boolean;

  constructor(
    public _table: SmartTable<any>,
    private geographyService: SettingsGeographyService,
    private notification: NotificationService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.initForm();
    this.filterByType(this.selectedType);
  }

  filterByType(item: any) {
    this.geographyService.list(item).then(geographies => {
      const ts = this._table.getTableState();
      this._table.use(geographies, {
        ...ts,
        slice: {
          page: ts.slice ? (ts.slice.page || 1): 1,
          size: 25
        }
      });
    }).catch(err => this.notification.error(null, err.error));
  }

  close() {
    this.geography = null;
    this.loading = false;
    this.sidePanelOpen = false;
    this.submitted = false;

    this.geographyForm.reset({
      enabled: true
    });
  }

  edit(geography: Geography) {
    this.geography = geography;
    this.geographyForm.patchValue({
      ...geography,
      delivery_time: geography.meta && !Array.isArray(geography.meta)? geography.meta.delivery_time: null
    });
    this.sidePanelOpen = true;
  }

  save() {
    this.submitted = true;

    if (this.geographyForm.valid) {
      const formValue = this.geographyForm.getRawValue();

      if (this.geography) {
        const body = Object.assign({}, formValue, {id: this.geography.id});

        if (!this.geography.meta || Array.isArray(this.geography.meta)) {
          body.meta = {
            delivery_time: body.delivery_time
          };
        }
        else {
          body.meta = {
            ...this.geography.meta,
            delivery_time: body.delivery_time
          }
        }

        delete body.delivery_time;

        this.geographyService.update(body)
          .toPromise()
          .then(res => {
            this.filterByType(this.selectedType);
            this.close();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
      else {
        const body = Object.assign({}, formValue, {
          meta: {
            delivery_time: formValue.deliveryTime
          }
        });
        delete body.deliveryTime;

        this.geographyService.create(body)
          .toPromise()
          .then(res => {
            this.filterByType(this.selectedType);
            this.close();
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.submitted = false;
    this.geographyForm = this.formBuilder.group({
      name: [null, Validators.required],
      type: [null, Validators.required],
      sub_type: null,
      delivery_time: null
    });

  }

}
