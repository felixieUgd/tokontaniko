import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';

import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';
import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

import { HealthService } from '../../health.service';
import { NotificationService } from 'src/app/_services/notification.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-health-build-settings',
  templateUrl: './health-build-settings.component.html',
  styleUrls: ['./health-build-settings.component.css']
})
export class HealthBuildSettingsComponent implements OnInit, OnDestroy {
  @Input() requestTypeId: number;

  diagnosticCodeForm: FormGroup;
  submitted: boolean;
  selectedDiagnosticCode: HealthDiagnosticCode;
  subscription: Subscription;

  healthDiagnosticCodes: HealthDiagnosticCode[];
  flatDiagnosticCodes: HealthDiagnosticCodeNode[];

  constructor(private fb: FormBuilder,
    private healthService: HealthService,
    private notification: NotificationService
  ) {
  }

  get Child() {
    return this.diagnosticCodeForm.get('Child') as FormArray;
  }

  get type() {
    return this.diagnosticCodeForm.get('field_type');
  }

  get isEditMode() {
    return Boolean(this.selectedDiagnosticCode);
  }

  ngOnInit() {
    this.initTree();
    this.initForm();
    this.detectTypeChange();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  addChild(title?: string) {
    this.Child.push(
      this.fb.group({
        title: title || null,
        field_type: 'category',
        value_type: 'boolean',
        isNew: true,
        is_required: false,
        parent_id: this.selectedDiagnosticCode ? this.selectedDiagnosticCode.id : null,
        Child: this.fb.array([]),
        request_type_id: this.requestTypeId,
      })
    )
  }

  detectTypeChange() {
    this.subscription = this.type.valueChanges.subscribe(newType => {
      if (!this.isQuestion(newType)) { //si simple
        while (this.Child.length) {
          this.Child.removeAt(0);
        }

        if (newType === 'boolean') {
          this.diagnosticCodeForm.get('value_type').setValue('boolean');
        }
      }
      else {
        if (this.Child.length === 0) {
          this.addChild();
        }
      }
    });
  }

  isQuestion(type: string) {
    return type === 'checkbox' || type === 'radio';
  }

  removeChildAt(index?: number) {
    if (this.Child.length > 1) {
      this.Child.removeAt(index);
    }
    else {
      this.notification.warning(null, 'EMPTY_RESPONSE_NOT_ALLOWED');
    }
  }

  edit(diagnosticCode: HealthDiagnosticCode) {
    this.reset();
    this.selectedDiagnosticCode = diagnosticCode;
    diagnosticCode = { ...diagnosticCode };
    if (diagnosticCode.Child) {
      this.arrayToForm(diagnosticCode.Child);
    }
    delete diagnosticCode.Child;

    this.diagnosticCodeForm.patchValue({ ...diagnosticCode });
  }

  formatDiagnosticCodeLabel(diagnosticCode: HealthDiagnosticCode) {
    return diagnosticCode.code + ' - ' + diagnosticCode.title;
  }

  saveDiagnosticCode() {
    this.submitted = true;
    if (this.diagnosticCodeForm.valid) {
      let formValue = this.diagnosticCodeForm.getRawValue();

      delete formValue.WeightField;
      delete formValue.HeightField;

      if (!formValue.parent_id) {
        formValue.field_type = 'category';
        formValue.value_type = null;
      }

      if (formValue.WeightField) {
        formValue.weight_field_id = formValue.WeightField.id;
      }
      else {
        delete formValue.WeightField;
      }

      if (formValue.HeightField) {
        formValue.height_field_id = formValue.HeightField.id;
      }
      else {
        delete formValue.HeightField;
      }

      if (!this.isEditMode) {
        this.healthService.createHealthDiagnosticCode(formValue).then(async created => {
          if (formValue.Child && formValue.Child.length > 0) {
            for (let i = 0; i < formValue.Child.length; i++) {
              const item = formValue.Child[i];
              item.parent_id = created.id;
              item.code = created.code + '_' + i.toString();

              await this.healthService.createHealthDiagnosticCode(item).then().catch(err => this.notification.error(null, err.error));
            }
          }

          this.initTree(created);
          this.notification.success(null, 'SAVE_SUCCESS');
          this.reset(formValue.type === 'category' ? formValue : undefined);
        }).catch(err => this.notification.error(null, err.error));
      }
      else { //edit
        formValue.id = this.selectedDiagnosticCode.id;
        const update = JSON.parse(JSON.stringify(formValue)) as HealthDiagnosticCode;

        this.healthService.updateHealthDiagnosticCode(this.selectedDiagnosticCode.id, update).then(async res => {
          if (formValue.Child && formValue.Child.length > 0) {
            for (let i = 0; i < formValue.Child.length; i++) {
              const item = formValue.Child[i];
              if (item.isNew) {
                item.parent_id = update.id;
                item.code = update.code + '_' + i.toString();

                await this.healthService.createHealthDiagnosticCode(item).then((res) => {

                }).catch(err => this.notification.error(null, err.error));
              }
            }
          }

          this.initTree(this.selectedDiagnosticCode);
          this.reset();
          this.notification.success(null, 'SAVE_SUCCESS');
        }).catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  reset(parent?: HealthDiagnosticCode) {
    this.diagnosticCodeForm.reset({
      request_type_id: this.requestTypeId,
      field_type: 'category',
      parent_id: parent ? parent.id : null
    });

    while (this.Child.length) {
      this.Child.removeAt(0);
    }

    this.submitted = false;
    this.selectedDiagnosticCode = null;
  }

  setParent(diagnosticCode: HealthDiagnosticCode) {
    this.reset();
    this.diagnosticCodeForm.patchValue({ parent_id: diagnosticCode.id });
  }

  private arrayToForm(children: HealthDiagnosticCode[]) {
    children.forEach((item) => {
      this.Child.push(
        this.fb.group(
          Object.assign(
            {},
            item
          )
        )
      );
    });
  }

  private findDiagnosticCode(id: number) {
    if (!id) {
      return null;
    }
    return this.flatDiagnosticCodes.find(cat => cat.id === id);
  }

  private flattenNestedObjectsArray(arr: any[], keepReference?: boolean, part?: any[], parent?: any) {
    var flattened = part || [], Child: any;
    arr.forEach((v) => {
      if (!keepReference) {
        v = { ...v };
      }

      if (Array.isArray(v.Child) && v.Child.length) {
        Child = v.Child;
        flattened.push(v);
        flattened.concat(flattened, this.flattenNestedObjectsArray(Child, keepReference, flattened, v));
      } else {
        flattened.push(v);
      }
    });
    return flattened;
  }

  private initForm() {
    this.diagnosticCodeForm = this.fb.group({
      code: [null, Validators.required],
      title: [null, Validators.required],
      field_type: ['category', Validators.required],
      unit: null,
      description: null,
      WeightField: null,
      HeightField: null,
      value_type: null,
      request_type_id: this.requestTypeId,
      value_min: null,
      value_max: null,
      is_required: null,
      Child: this.fb.array([]),
      parent_id: null
    });
  }

  private initTree(selected?: HealthDiagnosticCode) {
    this.healthService.getHealthTree(this.requestTypeId).then(tree => {
      this.healthDiagnosticCodes = tree;
      this.performFlatDiagnosticCodes(selected);
    }).catch(err => this.notification.error(null, err));
  }

  private performFlatDiagnosticCodes(selected?: HealthDiagnosticCodeNode) {
    this.flatDiagnosticCodes = this.flattenNestedObjectsArray(this.healthDiagnosticCodes, true);

    if (selected) {
      let currentId = selected.id;

      while (currentId) {
        const code = this.findDiagnosticCode(currentId) as HealthDiagnosticCodeNode;
        if (code) {
          code.toggle = true;
          currentId = code.parent_id;
        }
        else {
          break;
        }
      }
    }

    this.flatDiagnosticCodes = this.flatDiagnosticCodes.slice(0);
  }

}
