import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {AppService} from '../app.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {

  constructor(private httpClient: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.httpClient.post<any>([AppService.API, 'login'].join('/'), {
      email: email,
      password: password,
    });
  }

  sendVerificationCode(account) {
    return this.httpClient.post<any>(
      AppService.API + '/sendVerificationCode',
      account
    );
  }

  register(account) {
    return this.httpClient.post<any>(AppService.API + '/register', account);
  }

  logout() {
    sessionStorage.clear();

    this.router.navigate(['/']);
  }
}
