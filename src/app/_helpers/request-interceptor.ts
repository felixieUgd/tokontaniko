import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap, finalize} from 'rxjs/operators';
import {HttpRequestService} from '../_services/http-request.service';
import {AppService} from '../app.service';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {
  constructor(private httpRequestService: HttpRequestService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const API = AppService.API;
    const {url} = request;
    const apiRgx = new RegExp(`^${API}/(?!(static/(photo|logo))).*`);

    const isValidFetch = apiRgx.test(url);

    if (!isValidFetch) {
      return next.handle(request);
    }
    
    this.httpRequestService.set(true, url);
    return next.handle(request).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          this.httpRequestService.set(false, url);
        }
        return throwError(err);
      }),
      tap(res => {
        if (res instanceof HttpResponse) {
          this.httpRequestService.set(false, url);
        }
      }),
      finalize(() => {
        this.httpRequestService.set(false, url);
      })
    );
  }
}
