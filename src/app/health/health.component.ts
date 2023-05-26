import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Request, RequestType } from 'src/app/models/request';
import { ContactService } from '../contact/contact.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import Contact from '../models/contact';
import HealthDiagnosticCodeNode from '../models/health-diagnostic-code-node';
import { NotificationService } from '../_services/notification.service';
import { HealthService } from './health.service';
 
@Component({
  selector: 'app-health',
  templateUrl: './health.component.html'
})
export class HealthComponent implements OnInit {

  contact: Contact;
  requestTypes: RequestType[];
  requests: Request[];
  diagnosticTree: HealthDiagnosticCodeNode[];
  searchForm: FormGroup;
  submitted: boolean = false;
  isLoading: boolean = false;

  constructor(private healthService: HealthService,
              private formBuilder: FormBuilder,
              private requestService: MaintenanceService,
              private contactService: ContactService,
              private notification: NotificationService
  ) { }

  ngOnInit() {
    this.initForm();
    this.getTypes();
  }
  
  loadRequest() {
    this.submitted = true;
    if (this.searchForm.valid) {
      const formValue = this.searchForm.getRawValue();
      this.requests = null;
      this.isLoading = true;
      this.contactService.get(321).toPromise().then(contact => { //todo get by code
        this.contact = contact;
        return this.healthService.getHealthTree(formValue.type.id).then(tree => {
          const filter = {
            request_type_id: [
              {
                value: formValue.type.id,
                operator: 'equals',
                type: 'number'
              }
            ]
          };

          this.diagnosticTree = tree;

          return this.healthService.listByContact(contact.id, filter).then(requests => {
            this.requests = requests.map(request => {
              request.RawCodes = [...request.HealthDiagnosticCodes];
              request.HealthDiagnosticCodes = HealthService.mapTreeToTrackers(this.diagnosticTree, request.HealthDiagnosticCodes);
              return request;
            });
          });
        })
      }).catch(err => this.notification.error(null, err.error))
      .finally(() => {
        this.isLoading = false;
      });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private getTypes() {
    this.requestService.getTypes({type: 'all'}).toPromise().then(types => {
      this.requestTypes = types;
    }).catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.searchForm = this.formBuilder.group({
      code: [null, Validators.required],
      type: [null, Validators.required]
    });
  }

}
