import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {NotificationService} from 'src/app/_services/notification.service';
import {MaintenanceService} from '../maintenance.service';

@Component({
  selector: 'app-maintenance-search',
  templateUrl: './maintenance-search.component.html',
  styleUrls: []
})
export class MaintenanceSearchComponent implements OnInit {
  searchForm: FormGroup;

  submitted: boolean;

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private maintenanceService: MaintenanceService,
    private notification: NotificationService) {}

  ngOnInit() {
    this.initForm();
  }

  search() {
    this.submitted = true;

    if (this.searchForm.valid) {
      const id = this.searchForm.get('term').value;

      this.maintenanceService.search(id)
        .toPromise()
        .then(res => {
          if (res) {
            this.router.navigate(['/maintenance/detail/', id]);
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
    this.searchForm = this.formBuilder.group({
      term: ['', Validators.required]
    });
  }
}
