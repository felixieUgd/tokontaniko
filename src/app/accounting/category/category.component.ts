import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import * as moment from 'moment';
import Category from 'src/app/models/category';

import {AppService} from 'src/app/app.service';
import {CategoryService} from './category.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {ExportService} from 'src/app/_services/export.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html'
})
export class CategoryComponent implements OnInit {
  categoryForm: FormGroup;
  categories: Category[];
  category;
  sidePanelOpen;
  submitted;

  types;

  constructor(
    private appService: AppService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private exportService: ExportService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.sidePanelOpen = false;
    this.types = this.appService.category_types;

    this.initForm();
    this.getCategories();
  }

  edit(id) {
    this.sidePanelOpen = true;

    this.categoryService.get(id)
      .toPromise()
      .then(category => {
        this.category = category;
        this.categoryForm.patchValue(category);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  exportToExcel(data, filename) {
    const mapped = data.map(item => {
      return {
        id: item.id,
        name: item.name,
        type: this.translateService.instant('category.' + item.type),
        color: item.color,
        statut: item.enabled ? 'ACTIVE' : 'DESACTIVE',
        created: moment(item.created_at).format('YYYY-MM-DD HH:mm')
      };
    });

    this.exportService.exportToExcel(mapped, filename);
  }

  open() {
    this.sidePanelOpen = true;
    this.category = null;
    this.initForm();
  }

  save() {
    this.submitted = true;

    if (this.categoryForm.valid) {
      const category: Category = new Category(this.categoryForm.value);

      if (this.category) {
        this.update(category);
      }
      else {
        this.create(category);
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private create(category: Category) {
    this.categoryService.create(category)
      .toPromise()
      .then(res => {
        this.reset();
        this.notification.success(null, 'SAVE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private getCategories() {
    this.categoryService.list({type: 'all'})
      .toPromise()
      .then(categories => this.categories = categories)
      .catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.categoryForm = this.formBuilder.group({
      id: '',
      code: '',
      name: ['', Validators.required],
      type: ['', Validators.required],
      color: ['#000000', Validators.required],
      enabled: [true, Validators.required]
    });
  }

  private update(category: Category) {
    this.categoryService.update(category)
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
    this.categories.length = 0;
    this.submitted = false;
    this.sidePanelOpen = false;
    this.categoryForm.reset({
      color: '#000000',
      enabled: true
    });

    this.getCategories();
  }

}
