import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormGroup, FormBuilder, Validators, FormArray} from '@angular/forms';



import {HrPositionService} from '../hr-position.service';
import {NotificationService} from 'src/app/_services/notification.service';
import Position from 'src/app/models/position';

@Component({
  selector: 'app-hr-position-detail',
  templateUrl: './hr-position-detail.component.html',
  styleUrls: ['./hr-position-detail.component.css']
})
export class HrPositionDetailComponent implements OnInit {
  editForm: FormGroup;
  position: Position;

  submitted: boolean;
  id;
  field_types = ['int', 'boolean', 'string'];

  constructor(private formBuilder: FormBuilder,
              public positionService: HrPositionService,
              private notification: NotificationService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    this.initForm();
    this.getPosition(this.id);
  }

  addField() {
    const fg = this.formBuilder.group({
      key: [null, Validators.required],
      type: [null, Validators.required],
      display_name: [null, Validators.required]
    });

    this.submitted = false;
    this.CustomFields.push(fg);
  }

  deletePosition() {
    this.positionService.delete(this.id)
      .then(res => {
        this.router.navigate(['/hr/position']);
        this.notification.success(null, 'DELETE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  removeField(index) {
    this.CustomFields.removeAt(index);
  }

  resetForm() {
    this.submitted = false;
    this.editForm.reset();
  }

  save() {
    this.submitted = true;

    if (this.editForm.valid) {
      const body = this.editForm.getRawValue();

      this.positionService.update(body, this.id)
        .toPromise()
        .then(res => {
          this.router.navigate(['/hr/position']);
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  get CustomFields(): FormArray {
    return this.editForm.get('custom_fields') as FormArray;
  }

  private getPosition(id) {
    this.positionService.get(id)
      .then(res => {
        this.position = new Position(res);
        this.editForm.patchValue({
          title: res.title,
          description: res.description,
          paid_leaves: res.paid_leaves
        });
        this.arrayToForm(this.CustomFields, res.custom_fields);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.submitted = false;
    this.editForm = this.formBuilder.group({
      title: [null, Validators.required],
      description: [null, Validators.required],
      paid_leaves: [null, Validators.required],
      custom_fields: this.formBuilder.array([])
    });
  }

  private arrayToForm(formArray, data: any[]) {
    if (data) {
      data.forEach(item => formArray.push(this.formBuilder.group(item)));
    }
  }
}
