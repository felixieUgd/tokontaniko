import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { AppService } from 'src/app/app.service';
import { MenService } from 'src/app/men/men.service';
import { HealthService } from '../../health.service';
import { ContactService } from 'src/app/contact/contact.service';
import { SharedService } from 'src/app/_services/shared.service';
import { SessionService } from 'src/app/_services/session.service';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { CategoryService } from 'src/app/accounting/category/category.service';
import { SettingsCompanyService } from 'src/app/settings/company/settings-company.service';

import * as moment from 'moment';

import { JoyrideService } from 'ngx-joyride';
import { JoyrideOptions } from 'ngx-joyride/src/models/joyride-options.class';

import Request from 'src/app/models/request';
import Contact from 'src/app/models/contact';
import Category from 'src/app/models/category';
import Facility from 'src/app/models/facility';
import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-health-diagnostic-add',
  templateUrl: './health-diagnostic-add.component.html',
  styleUrls: ['./health-diagnostic-add.component.css']
})
export class HealthDiagnosticAddComponent implements OnInit, OnDestroy {
  healthDiagnosticCodes: HealthDiagnosticCode[];
  submitted = false;
  isValid = false;
  minDate: any;
  maxDate: any;
  identityForm: FormGroup;
  subscription = new Subscription();

  requestTypeId: number;

  Category: Category;

  step: number;

  selectedContact: Contact;

  previousRequests: Request[];

  searchContact = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => {
        this.identityForm.get('id').setValue(null);

        if (term.length < 3){
          return [];
        }
        else {
          return this.contactService.select(term)
            .toPromise()
            .then(res => {
              return res.length > 0 ? res : [{id: 0, name: term}];
            })
            .catch(err => {
              this.notification.error(null, err.error);
            })
        }
      })
  );

  formatter = (item: Facility) => {
    return item.name;
  }

  searchFacility = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => term.length <= 3 ? [] :
        this.menService.select(term)
          .toPromise()
          .then(res => {
            return res.length > 0 ? res : [null];
          })
          .catch(err => {
            this.notification.error(null, err.error);
          }))
    );

  constructor(public healthService: HealthService,
              public menService: MenService,
              private router: Router,
              private appService: AppService,
              private formBuilder: FormBuilder,
              private joyrideService: JoyrideService,
              private sharedService: SharedService,
              private contactService: ContactService,
              private route: ActivatedRoute,
              private notification: NotificationService,
              private sessionService: SessionService,
              private requestService: MaintenanceService,
              private maintenanceService: MaintenanceService,
              private categoryService: CategoryService,
              private settingsCompanyService: SettingsCompanyService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.requestTypeId = Number(navigation.extras.state.request_type_id);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  handleClose($event: any) {
    if (this.step > 0) {
      $event.returnValue = false;
    }
  }

  ngOnInit() {
    if (!this.requestTypeId) {
      this.maintenanceService.getTypes({type: 'all'}).toPromise().then(types => {
        const find = types.find(type => type.meta && type.meta.route && this.router.url.startsWith(type.meta.route));
        if (find) {
          this.requestTypeId = find.id;
          this.setup();
        }
        else {
          this.notification.error(null, 'TYPE_NOT_FOUND');
          this.router.navigate(['/health/add']);
        }
      }).catch(err => this.notification.error(null, err.error));
    }
    else {
      this.setup();
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSelectContact = (event): void => {
    event.preventDefault();
    const selected = event.item;

    if (selected.id) {
      this.loadContact(selected.id);
    }
    else {
      this.sharedService.updateSidePanel(true);
      this.sharedService.newContact({
        name: selected.name,
        meta: {
          contact_type: 'STUDENT'
        }
      });
      this.identityForm.reset();
    }
  };

  onSelectFacility(event: any) {
    if (!event.item) {
      event.preventDefault();
    }
  }

  setStep(step: number) {
    document.querySelector('.page-container').scrollTop = 0;

    this.healthService.setCurrentStep(step);

    //play result onBoarding guide if required
    if (step === this.healthDiagnosticCodes.length + 1 && sessionStorage.getItem('continueOnboarding')) {
      sessionStorage.removeItem('continueOnboarding');

      const options: JoyrideOptions = {
        steps: ['result@health/diagnostic/add', 'goBack@health/diagnostic/add', 'save@health/diagnostic/add'],
        waitingTime: 1000,
        themeColor: '#26475f',
        logsEnabled: false
      };

      this.subscription.add(
        this.joyrideService.startTour(options).subscribe(
          (step) => {
          },
          (error) => {
          },
          () => {
          }
        )
      );
    }
  }

  reload() {
    this.healthService.getHealthTree(2).then(tree => {
      this.healthDiagnosticCodes = tree;
    }).catch(err => {
      this.notification.error(null, err.error);
    })
  }

  save() {
    const formValue = this.identityForm.getRawValue();
    formValue.bio_dob = moment(formValue.bio_dob).format('YYYY-MM-DD');
    formValue.facility_id = formValue.Facility.id;

    delete formValue.Facility;

    const contact = formValue;
    contact.meta = Object.assign(this.selectedContact.meta, {
      school_serial: formValue.school_serial,
      school_grade: formValue.school_grade
    });

    delete contact.school_grade;
    delete contact.school_serial;
    delete contact.code;

    const trackers = HealthService.generateTrackers(this.healthDiagnosticCodes); //create tracker from input data
    this.contactService.update(new Contact(contact)).toPromise().then(() => {
      const user = this.sessionService.getUser();

      const month = moment().format('MMMM');
      const year = moment().format('YYYY');
      const name = 'Visite médicale - ' + month + ' ' + year;

      const maintenance = new Request({
        title: name,
        category_id: this.Category? this.Category.id: null,
        category_name: this.Category? this.Category.name: null,
        description: name,
        requested_at: new Date().toISOString(),
        facility_id: formValue.facility_id,
        type: 'HEALTH',
        status: 'COMPLETED',
        request_type_id: this.requestTypeId,
        Staffs: [
          {
            id: user.id
          }
        ],
        Contacts: [
          {
            id: formValue.id
          }
        ]
      });
      //create request dynamically
      return this.requestService.create(maintenance).toPromise().then(request => {
        return this.healthService.createTrackers(request.id, trackers).then(() => {
          this.notification.success(null, 'SAVE_SUCCESS');
          this.router.navigate(['/health/detail/' + this.selectedContact.id + '/document', request.id]);
        });
      })
    }).catch(err => this.notification.error(null, err.error));
  }

  setStepFromTimeline(target: number) {
    if (this.step > target) {
      this.setStep(target);
    }
  }

  startDiagnostic() {
    this.submitted = true;
    this.isValid = this.identityForm.valid;
    if (this.isValid) {
      const formValue = this.identityForm.getRawValue();
      const filter = {
        request_type_id: [
          {
            value: this.requestTypeId,
            operator: 'equals',
            type: 'number'
          }
        ]
      }
      this.healthService.listByContact(formValue.id, filter).then(requests => {
        this.previousRequests = requests;
        if (requests.length) {
          const lastDoc = requests[0];
          return this.healthService.get(lastDoc.id).then(document => {
            lastDoc.HealthDiagnosticCodes = HealthService.mapTreeToTrackers(this.healthDiagnosticCodes, document.HealthDiagnosticCodes, true);
            this.setStep(this.step + 1);
          });
        }
        else {
          this.setStep(this.step + 1);
        }
      }).catch(err => {
        this.notification.error(null, err.error)
      });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  truncate(source: string) {
    if (!source) {
      return '';
    }
    return source.length > 30 ? source.substring(0, 30) + "…" : source;
  }

  private initForm() {
    this.identityForm = this.formBuilder.group({
      id: [null, Validators.required],
      name: [null, Validators.required],
      age: null,
      sex: [null, Validators.required],
      school_grade: [null, Validators.required],
      school_serial: null,
      code: [null, Validators.required],
      bio_dob: [null, Validators.required],
      Facility: [null, Validators.required]
    });
  }

  private loadCategory() {
    const field = 'general.default_health_diagnostic_category';
    this.settingsCompanyService.getSettings(this.sessionService.getCompanyId(), [field]).toPromise().then(company => {
      const id = +company.Settings[field];
      if (isNaN(id)) {
        this.notification.error(null, 'CATEGORY_NOT_FOUND');
      }
      else {
        this.categoryService.get(id).toPromise().then(category => {
          this.Category = category;
        }).catch(err => this.notification.error(null, err.error));
      }
    }).catch(err => this.notification.error(null, err.error));
  }

  private loadContact(id: number) {
    this.contactService.get(id).toPromise().then(contact => {
      if (contact.bio_dob) {
        contact.bio_dob = new Date(contact.bio_dob);
      }

      this.selectedContact = contact;

      this.identityForm.patchValue({
        ...contact,
        school_grade: contact.meta? contact.meta.school_grade: null,
        school_serial: contact.meta? contact.meta.school_serial: null
      });
    }).catch(err => {
      console.log(err);
      this.notification.error(null, err.error);
    });
  }

  private setup() {
    this.reload();

    this.minDate = this.appService.getMinDate();
    this.maxDate = this.appService.getMaxDate();

    this.healthService.setCurrentStep(0);

    this.subscription.add(
      this.healthService.$currentStep.subscribe(step => {
        this.step = step;
      })
    );

    this.initForm();

    this.subscription.add(
      this.identityForm.get('bio_dob').valueChanges.subscribe(date => {
        let age = moment().diff(date, 'years');
        if (!isNaN(age)) {
          this.identityForm.get('age').setValue(age.toString().concat(' ans'));
        }
      })
    );

    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        const idParam = params['id'];
        if (idParam && !isNaN(+idParam)) {
          this.loadContact(+idParam);
        }
      })
    );

    this.loadCategory();
  }
}
