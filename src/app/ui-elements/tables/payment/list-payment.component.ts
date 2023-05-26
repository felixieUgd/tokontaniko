import { Component, Input, OnInit, Output, EventEmitter} from '@angular/core';

import * as moment from 'moment';
import Revenue from 'src/app/models/revenue';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {AccountingService} from 'src/app/_services/accounting.service';
import {ConfirmModalComponent} from '../../modals/confirm-modal/confirm-modal.component';
import {CurrencyPipe} from '@angular/common';
import {ExportService} from 'src/app/_services/export.service';
import {IncomeService} from 'src/app/income/income.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-list-payment',
  templateUrl: './list-payment.component.html',
  styleUrls: [],
  providers: [CurrencyPipe]
})
export class ListPaymentComponent implements OnInit {
  @Input() facture: any;  //  Invoice or Bill
  @Input() dataTable: Array<Revenue>;
  @Output() onSave = new EventEmitter<any>();

  constructor(
    private currencyPipe: CurrencyPipe,
    private ngbModal: NgbModal,
    private accountingService: AccountingService,
    private exportService: ExportService,
    private incomeService: IncomeService,
    private notification: NotificationService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
  }

  exportToExcel(data, filename) {
    const mapped = data.map(item => {
      return {
        id: item.id,
        paid_at: moment(item.paid_at).format('YYYY-MM-DD HH:mm'),
        description: item.description,
        amount: item.amount,
        account_id: item.account_id,
        payment: item.payment_method,
        user_name: item.User ? item.User.name : '',
        created_at: moment(item.created_at).format('YYYY-MM-DD HH:mm')
      };
    });

    this.exportService.exportToExcel(mapped, filename);
  }

  openConfirm(revenue: Revenue) {
    const paymentMethod = this.translate.instant('payment.' + revenue.payment_method);
    const amount = this.currencyPipe.transform(revenue.amount, revenue.currency_code);
    const modalRef = this.ngbModal.open(ConfirmModalComponent, {backdrop: 'static'});
    modalRef.componentInstance.type = 'danger';
    modalRef.componentInstance.text = `${paymentMethod} - ${amount}`;

    modalRef.result.then(res => {
      if (res) {
        this.incomeService.refundReward(revenue.id)
        .then(res => {
          this.notification.success(null, 'REFUND_SUCCESS');
          this.onSave.emit();
        })
        .catch(err => this.notification.error(null, err.error));
      }
    })
    .catch(err => console.log(''));
  }

  refund(payment) {
    this.accountingService.facture.next(this.facture);
    this.accountingService.payment.next({
      amount: payment.amount * -1,
      account_id: payment.account_id,
      payment_method: payment.payment_method
    });
    this.accountingService.sidePanelPayment.next(true);
  }

}
