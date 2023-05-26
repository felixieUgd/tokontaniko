import { Directive, OnInit, HostListener, Input, ElementRef, Output, EventEmitter } from '@angular/core';

import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

@Directive({
  selector: '[healthResponseInput]'
})
export class HealthResponseInputDirective implements OnInit {
  @Input() diagnosticCode: HealthDiagnosticCodeNode;
  @Output() checkValidity = new EventEmitter<HealthDiagnosticCodeNode>();

  constructor(private elementRef: ElementRef<HTMLInputElement>) { }

  ngOnInit() {
  }

  @HostListener('keydown', ['$event']) onKeyDown($event: any){
    setTimeout(() => {
      if (this.diagnosticCode.hasError) {
        this.checkValidity.next(this.diagnosticCode);
      }
    })
  }

  get element() {
    return this.elementRef.nativeElement;
  }

  setErrorClass(state: boolean) {
    if (state === true) {
      this.element.classList.add('error');
    }
    else {
      this.element.classList.remove('error');
    }
  }

}
