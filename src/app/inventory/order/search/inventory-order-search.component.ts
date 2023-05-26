import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';

@Component({
  selector: 'app-inventory-order-search',
  templateUrl: './inventory-order-search.component.html',
  styleUrls: ['./inventory-order-search.component.css']
})
export class InventoryOrderSearchComponent implements OnInit {

  submitted: boolean;
  searchForm: FormGroup;

  constructor(private fb: FormBuilder,
              private router: Router,
              private notification: NotificationService,
              private maintenanceService: MaintenanceService,
  ) { }

  ngOnInit() {
    this.initForm();
  }

  search() {
    this.submitted = true;

    if (this.searchForm.valid) {
      const id = this.searchForm.get('id').value;

      this.maintenanceService.search(id)
        .toPromise()
        .then(res => {
          if (res) {
            this.router.navigate(['/inventory/order/detail/', id]);
          }
          else {
            this.notification.error(null, 'REQUEST_NOT_FOUND');
          }
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.searchForm = this.fb.group({
      id: [null, Validators.required]
    });
  }

}
