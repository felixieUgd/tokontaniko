import {Component, OnDestroy, OnInit} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import {Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core';
import {Keepalive} from '@ng-idle/keepalive';
import {NgbDatepickerConfig, NgbModal} from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment';
import {LockScreenComponent} from './ui-elements/modals/lock-screen/lock-screen.component';

import {SessionService} from './_services/session.service';
import {TranslateService} from '@ngx-translate/core';
import {ImageService} from './_services/image.service';
import { SharedService } from './_services/shared.service';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountingService } from './_services/accounting.service';
import {TransferService} from './accounting/transfer/transfer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [NgbDatepickerConfig]
})
export class AppComponent implements OnInit, OnDestroy {
  private today = new Date();

  subscription = new Subscription();

  constructor(
    private sessionService: SessionService,
    private sharedService: SharedService,
    private accountingService: AccountingService,
    private router: Router,
    private config: NgbDatepickerConfig,
    private idle: Idle,
    private imageService: ImageService,
    private keepalive: Keepalive,
    private ngbModal: NgbModal,
    private transferService: TransferService,
    private translate: TranslateService
  ) {
    /* config.minDate = {
      year: this.today.getFullYear(),
      month: this.today.getMonth() + 1,
      day: this.today.getDate()
    }; */

    this.initIdle();
  }

  ngOnInit(): void {
    const browserLang = this.translate.getBrowserLang();

    this.subscription.add(
      this.router.events.subscribe((e: any) => {
        if (e instanceof NavigationEnd) {
          this.sharedService.updateSidePanel(false);
          this.sharedService.sidePanelItem.next(false);
          this.accountingService.sidePanelPayment.next(false);
          this.transferService.sidePanelTransfer.next(false);
        }
      })
    )

    this.translate.setDefaultLang('fr');
    registerLocaleData(localeFr, this.translate.defaultLang);
    moment.locale(this.translate.defaultLang);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initIdle() {
    // sets an idle timeout of 90 seconds.
    this.idle.setIdle(150);
    // sets a timeout period of 5 seconds. after 90 seconds of inactivity, the user will be considered timed out.
    this.idle.setTimeout(5);
    // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    this.idle.onIdleStart.subscribe(() => {
      // console.log('You\'ve gone idle!');
    });
    this.idle.onIdleEnd.subscribe(() => {
      // console.log('No longer idle.');
    });
    this.idle.onTimeout.subscribe(() => {
      // console.log('Timed out!');

      if (this.sessionService.getToken()) {
        const modalRef = this.ngbModal.open(LockScreenComponent, {
          backdrop: 'static',
          keyboard: false,
          size: 'lg',
          windowClass: 'img-preview'
        });
      }
      else {
        // console.log('Timed out . Not logged in !');
      }
    });
    this.idle.onTimeoutWarning.subscribe(countdown => {
      // console.log('You will time out in ' + countdown + ' seconds!')
    });

    // sets the ping interval to 15 seconds
    this.keepalive.interval(15);

    this.keepalive.onPing.subscribe(() => {
      // console.log(moment().format('YYYY-MM-DD HH:mm'));
    });
  }
}
