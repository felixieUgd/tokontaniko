import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactService } from 'src/app/contact/contact.service';
import { NotificationService } from 'src/app/_services/notification.service';

@Component({
  selector: 'app-health-search',
  templateUrl: './health-search.component.html',
  styleUrls: ['./health-search.component.css']
})
export class HealthSearchComponent implements OnInit {
  searchForm: FormGroup;
  submitted: boolean;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private notification: NotificationService,
    private contactService: ContactService,
  ) { }

  ngOnInit() {
    this.initForm();
  }

  search() {
    this.submitted = true;
    if (this.searchForm.valid) {
      const formValue = this.searchForm.getRawValue();
      this.contactService.find(formValue.code).toPromise().then(contact => {
        if (contact) {
          this.router.navigate(['/health/detail', contact.id]);
        }
        else {
          this.notification.error(null, 'CONTACT_NOT_FOUND');
        }
      }).catch(err => this.notification.error(null, err.error));
    }
  }

  private initForm() {
    this.searchForm = this.formBuilder.group({
      code: [null, Validators.required]
    });
  }

}
