import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {NotificationService} from 'src/app/_services/notification.service';
import {InvoiceService} from '../invoice/invoice.service';

@Component({
  selector: 'app-income-search',
  templateUrl: './income-search.component.html',
  styleUrls: []
})
export class IncomeSearchComponent implements OnInit {
  searchForm: FormGroup;

  submitted: boolean;

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private invoiceService: InvoiceService,
    private notification: NotificationService) {}

  ngOnInit() {
    this.initForm();
  }

  search() {
    this.submitted = true;

    if (this.searchForm.valid) {
      const id = this.searchForm.get('term').value;

      this.invoiceService.search(id)
        .toPromise()
        .then(res => {
          if (res) {
            this.router.navigate(['/income/invoice/detail/', id]);
          }
          else {
            this.notification.error(null, 'INVOICE_NOT_FOUND');
          }
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.searchForm = this.formBuilder.group({
      term: ['', Validators.required]
    });
  }
}
