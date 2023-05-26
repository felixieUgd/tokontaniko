import {Directive, ElementRef, OnInit, OnDestroy} from '@angular/core';
import { HttpRequestService } from 'src/app/_services/http-request.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appXhrBtnIndicator]'
})
export class XhrBtnIndicatorDirective implements OnInit, OnDestroy {

  requestSub: Subscription;

  constructor(private el: ElementRef, private httpRequestService: HttpRequestService) {
  }

  ngOnInit() {
    this.requestSub = 
      this.httpRequestService
        .httpRequest$
          .subscribe(state => {
            this.setEnabled(!state);
          });
  }

  ngOnDestroy() {
    if(this.requestSub) {
      this.requestSub.unsubscribe();
    }
  }

  setEnabled(state: boolean) {
    if(state === true){
      this.el.nativeElement.removeAttribute('disabled');
    } else {
      this.el.nativeElement.setAttribute('disabled', true);
    } 
  }
}
