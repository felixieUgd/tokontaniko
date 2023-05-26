import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { HealthService } from '../../../health/health.service';

import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';
import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

@Component({
  selector: 'health-tree-view-content',
  templateUrl: './health-tree-view-content.component.html',
  styleUrls: ['./health-tree-view-content.component.css']
})
export class HealthTreeViewContentComponent implements OnInit {
  @Input() treeNodes: HealthDiagnosticCodeNode[];
  @Input() level = 0;
  @Input() displayOnly: boolean;
  @Input() trueOnly: boolean;

  @Output() openEditMode = new EventEmitter<HealthDiagnosticCode>();
  @Output() openAddChild = new EventEmitter<HealthDiagnosticCode>();

  MedicalService = HealthService;

  constructor() { }

  ngOnInit() {
  }

  

  move(index: number, direction: number) {
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < this.treeNodes.length) {
      this.arrayMove(this.treeNodes, index, targetIndex);
    }
  }

  hasChild(diagnosticCode: HealthDiagnosticCodeNode) {
    let isActive = true;
    if (this.displayOnly) {
      isActive = HealthService.isResponse(diagnosticCode)? diagnosticCode.value: true;
    }
    return isActive && diagnosticCode.Child && diagnosticCode.Child.length > 0;
  }

  toggleAndEdit(diagnosticCode: HealthDiagnosticCodeNode) {
    diagnosticCode.toggle = true;
    this.performEdit(diagnosticCode);
  }

  performAddChild(diagnosticCode: HealthDiagnosticCode) {
    this.openAddChild.next(diagnosticCode);
  }

  performEdit(diagnosticCode: HealthDiagnosticCode) {
    this.openEditMode.next(diagnosticCode);
  }

  shouldShow(node: HealthDiagnosticCode) {
    if (!this.displayOnly)
      return true;
    
    if (this.trueOnly) {
      if (node.field_type === 'category' || HealthService.isQuestion(node)) {
        if (node.Child && node.Child.length) {
          for (let child of node.Child) {
            if (this.shouldShow(child)) {
              return true;
            }
          }
          return false;
        }
      }
      else if (node.field_type === 'boolean') {
        return HealthService.parseBooleanValue(node.value);
      }
      else if (node.value_type === 'string' && !node.value) {
        return false;
      }
    }

    if (node.ParentDiagnosticCode) {
      const type = node.ParentDiagnosticCode.field_type;
      if (type === 'checkbox') {
        return !!node.value;
      }
      else if (type === 'radio') {
        if (node.value && node.title.toLowerCase().startsWith('aucun')) {
          return false;
        }
        
        return HealthService.parseBooleanValue(node.value);
      }
    }
    
    return true;
  }

  shouldShowValue(node: HealthDiagnosticCode) {
    if (!this.displayOnly) {
      return false;
    }
    if (HealthService.isResponse(node)) {
      return false;
    }
    
    if (this.trueOnly && node.field_type === 'boolean') {
      return false;
    }

    return true;
  }

  truncate(source: string) {
    return source.length > 30 ? source.substring(0, 30) + "…" : source;
  }

  private arrayMove(arr: any[], fromIndex: number, toIndex: number) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
  }
}
