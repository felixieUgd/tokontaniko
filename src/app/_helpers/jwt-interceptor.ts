import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpParams, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs/index';

import {AuthenticationService} from '../_services/authentication.service';
import {SessionService} from '../_services/session.service';
import {AppService} from '../app.service';
import {environment} from 'src/environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthenticationService,
    private sessionService: SessionService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    const token = this.sessionService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          'x-access-token': `${token}`,
          // version: environment.version // todo check version
        }
      });
    }

    const API = AppService.API;
    const URL = request.url;

    if ((!token && !URL.startsWith(API + '/login')) || !API) this.authService.logout();

    return next.handle(request);
  }
}
