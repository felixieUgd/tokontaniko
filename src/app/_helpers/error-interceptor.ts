import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs/index';
import {catchError} from 'rxjs/internal/operators';
import {Router} from '@angular/router';
import {NotificationService} from '../_services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private notification: NotificationService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(request).pipe(catchError(err => {
      if (err.status === 401 && this.router.url !== '/authentication/login') {
        // location.reload(true);
        this.notification.error(null, err.error);
        this.router.navigate(['/authentication/login']);
      }
      else if (err.status === 403 && (!err.error && !err.error.message)) {
        this.notification.error(null, 'ACCESS_NOT_AUTHORIZED');
      }

      return throwError(err);
    }));
  }
}
