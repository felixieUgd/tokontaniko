import {Injectable, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Rx';
import {ToastOptions, ToastyService} from 'ng2-toasty';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private positionSource = new Subject<string>();
  private subscription: Subscription;
  private failedSubscription: Subscription;
  private toastOptions: ToastOptions;
  private THEME = {
    bootstrap: 'bootstrap',
    _default: 'default',
    material: 'material',
  };

  position$ = this.positionSource.asObservable();

  constructor(private toastyService: ToastyService, private translate: TranslateService) {
    this.toastOptions = {
      title: 'TITLE',
      msg: 'MESSAGE',
      showClose: true,
      timeout: 10000,
      theme: this.THEME.bootstrap
    };
  }

  private translateMessage(text, type?): string {
    const translateText = 'msg.' + text;
    this.subscription = this.translate.get(translateText).subscribe((res: string) => {
      //  Check if translation not found
      if (translateText === res && type === 'ERROR') {
        text = this.translateMessage('GENERIC_ERROR');
      } else {
        text = res;
      }
    });

    return text;
  }

  clearMessage() {
    this.toastyService.clearAll();
  }

  error(title, content) {
    const isObject = content ? content.hasOwnProperty('message') : false;
    let message = isObject ? content.message : content;

    if (/.*UNIQUE_CONSTRAINT_ERROR.*/.test(message)) {
      message = content.error.toUpperCase() + '_NOT_UNIQUE';
    }

    this.toastOptions.title = this.translateMessage(title || 'ERROR');
    this.toastOptions.msg = this.translateMessage(message, 'ERROR');

    this.toastyService.error(this.toastOptions);
  }

  info(title, message) {
    title = this.translateMessage(title || 'INFO');
    message = this.translateMessage(message);

    this.toastOptions.title = title;
    this.toastOptions.msg = message;

    this.toastyService.info(this.toastOptions);
  }

  message(type, options) {
    this.clearMessage();

    this.toastOptions = options;

    switch (type) {
      case 'default':
        this.toastyService.default(this.toastOptions);
        break;
      case 'info':
        this.toastyService.info(this.toastOptions);
        break;
      case 'success':
        this.toastyService.success(this.toastOptions);
        break;
      case 'wait':
        this.toastyService.wait(this.toastOptions);
        break;
      case 'error':
        this.toastyService.error(this.toastOptions);
        break;
      case 'warning':
        this.toastyService.warning(this.toastOptions);
        break;
    }
  }

  setPosition(position) {
    this.positionSource.next(position);
  }

  success(title, message) {
    title = this.translateMessage(title || 'SUCCESS');
    message = this.translateMessage(message);

    this.toastOptions.title = title;
    this.toastOptions.msg = message;

    this.toastyService.success(this.toastOptions);
  }

  warning(title, message) {
    title = this.translateMessage(title || 'WARNING');
    message = this.translateMessage(message);

    this.toastOptions.title = title;
    this.toastOptions.msg = message;

    this.toastyService.warning(this.toastOptions);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
