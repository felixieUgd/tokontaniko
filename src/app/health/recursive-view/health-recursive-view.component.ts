import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

import { NotificationService } from 'src/app/_services/notification.service';
import { HealthService } from '../health.service';

import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

@Component({
  selector: 'health-recursive-view',
  templateUrl: './health-recursive-view.component.html',
  styleUrls: ['./health-recursive-view.component.css']
})
export class HealthRecursiveViewComponent implements OnInit {
  @Input() treeNodes: HealthDiagnosticCodeNode;
  @Input() parentNode: HealthDiagnosticCodeNode;
  @Input() level = 0;

  @Input() isLast: boolean = true;

  //Can't use service injection properly in recursive component so use data binding instead
  @Input() step: number;

  @Output() onStepChange = new EventEmitter<number>();

  MedicalService = HealthService;

  constructor(private notification: NotificationService,
  ) { }

  ngOnInit() {
  }

  format(description: string) {
    if (!description) {
      return '';
    }
    return description.replace(/(?:\r\n|\r|\n)/g, '<br>');
  }

  toggle(selected: HealthDiagnosticCodeNode) {
    if (!selected || !this.parentNode) {
      this.notification.warning(null, 'PARENT_NOT_FOUND');
      return;
    }

    this.parentNode.hasError = false;

    //deselect all but selected
    if (this.parentNode.field_type === 'radio') {
      if (this.parentNode.Child) {
        this.parentNode.Child.forEach(item => {
          item.value = false;
        })
      }
      
      selected.value = true;
    }
    else {
      selected.value = !selected.value;
    }
  }

  toggleBoolean(selected: HealthDiagnosticCodeNode, state: boolean) {
    selected.hasError = false;
    selected.value = state;
  }

  setStep(step: number) {
    this.onStepChange.next(step);
  }

  nextStep(current: HealthDiagnosticCodeNode) {
    if (this.isValid(current)) { //check validity before next steo
      this.setStep(this.step + 1);
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  isNumberKey(evt: any) {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
  }

  isValid(diagnosticCode: HealthDiagnosticCodeNode) {
    let valid = false; //initialize to false
    switch (diagnosticCode.field_type) {
        case 'boolean':
        case 'plain': {
          if (diagnosticCode.value == null) {
            valid = !diagnosticCode.is_required;
          }
          else {
            valid = true;
          }

          if (valid && typeof diagnosticCode.value === diagnosticCode.value_type) {
            if (valid && diagnosticCode.value_type === 'number') {
              if (typeof diagnosticCode.value_min === 'number') {
                valid = diagnosticCode.value >= diagnosticCode.value_min; //check minimum value
              }

              if (valid && typeof diagnosticCode.value_max === 'number') {
                valid = diagnosticCode.value <= diagnosticCode.value_max; //check maximum value
              }
            }
          }
          break;
        }
        case 'radio': {
          for (let child of diagnosticCode.Child) { //check if a response is checked
            if (child.value) {
              if (child.Child && child.Child.length > 0) {
                valid = this.isValid(child);
              }
              else {
                valid = true;
                break;
              }
            }
          }
          break;
        }
        case 'checkbox': {
          valid = true; //default value is true
          break;
        }
        default: {
          if (diagnosticCode.Child) {
            for (let child of diagnosticCode.Child) {
              valid = this.isValid(child);
              if (!valid) {
                break;
              }
            }
          }
          else {
            valid = true;
          }
        }
    }
    diagnosticCode.hasError = !valid; //set error state
    return valid;
  }

  setValue(code: HealthDiagnosticCodeNode, value: any) {
    code.value = value;
  }

  private findDiagnosticCodeRecursively(items: HealthDiagnosticCodeNode[], id: number) {
    if (!items) { 
      return null; 
    }
  
    for (const item of items) {
      if (item.id === id) { 
        return item; 
      }
  
      const child = this.findDiagnosticCodeRecursively(item.Child, id);
      if (child) { 
        return child; 
      }
    }
  }

}
