import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';
import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

@Component({
  selector: 'health-tree-view',
  templateUrl: './health-tree-view.component.html'
})
export class HealthTreeViewComponent implements OnInit {
  @Input() treeNodes: HealthDiagnosticCodeNode[];
  @Input() displayOnly: boolean;
  @Input() trueOnly: boolean;

  @Output() openEditMode = new EventEmitter<HealthDiagnosticCode>();
  @Output() openAddChild = new EventEmitter<HealthDiagnosticCode>();

  constructor() { }

  ngOnInit() {
  }

  setEdit(diagnosticCode: HealthDiagnosticCode) {
    this.openEditMode.next(diagnosticCode);
  }

  setAddChild(diagnosticCode: HealthDiagnosticCode) {
    this.openAddChild.next(diagnosticCode);
  }

  expandAll(branch?: HealthDiagnosticCodeNode[]) {
    branch = branch || this.treeNodes;
    branch.forEach(node => {
      this.expand(node);
      if (node.Child && node.Child.length > 0) {
        this.expandAll(node.Child);
      }
    })
  }

  collapseAll(branch?: HealthDiagnosticCodeNode[]) {
    branch = branch || this.treeNodes;
    branch.forEach(node => {
      this.collapse(node);
      if (node.Child && node.Child.length > 0) {
        this.collapseAll(node.Child);
      }
    })
  }

  private expand(node: HealthDiagnosticCodeNode) {
    node.toggle = true;
  }

  private collapse(node: HealthDiagnosticCodeNode) {
    node.toggle = false;
  }
}
