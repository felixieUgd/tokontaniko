import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpRequestService {

  private requestMap:Map<string, boolean> = new Map<string, boolean>() ;

  public httpRequest$ = new BehaviorSubject<boolean>(false) ;
  timeoutReset: any;

  constructor() {
  }

  reset(){
    this.requestMap.clear() ;
    this.httpRequest$.next(false) ;
  }
  
  set(loading: boolean, url: string){
    if (!url) {
      throw new Error('URL_NOT_DEFINED');
    }
    
    if (loading === true) {
      /* if (this.timeoutReset) {
        clearTimeout(this.timeoutReset);
        this.timeoutReset = setTimeout(() => {
          console.log('Clear queue after 15s');
          this.requestMap.clear();
        }, 15000);
      } */
      this.requestMap.set(url, loading);
      this.httpRequest$.next(true);
    }
    else if (loading === false && this.requestMap.has(url)) {
      this.requestMap.delete(url);
    }
    
    if (this.requestMap.size === 0) {
      this.httpRequest$.next(false);
    }
  }
}
