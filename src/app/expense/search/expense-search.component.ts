import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {NotificationService} from 'src/app/_services/notification.service';
import {BillService} from 'src/app/expense/bill/bill.service';

@Component({
  selector: 'app-expense-search',
  templateUrl: './expense-search.component.html',
  styleUrls: []
})
export class ExpenseSearchComponent implements OnInit {
  searchForm: FormGroup;

  submitted: boolean;

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private billService: BillService,
    private notification: NotificationService) {}

  ngOnInit() {
    this.initForm();
  }

  search() {
    this.submitted = true;

    if (this.searchForm.valid) {
      const id = this.searchForm.get('term').value;

      this.billService.search(id)
        .toPromise()
        .then(res => {
          if (res) {
            this.router.navigate(['/expense/bill/detail/', id]);
          }
          else {
            this.notification.error(null, 'INVOICE_NOT_FOUND');
          }
        })
        .catch(err => this.notification.error(null, err.error));
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
