import {Component, OnInit} from '@angular/core';
import {debounceTime, distinctUntilChanged, switchMap, tap} from 'rxjs/operators';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {concat, Observable, of, Subject, Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';

import * as moment from 'moment';

import Category from 'src/app/models/category';
import User from 'src/app/models/user';

import {AppService} from 'src/app/app.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {ContactService} from 'src/app/contact/contact.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SharedService} from 'src/app/_services/shared.service';
import {UserService} from 'src/app/settings/user/user.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import Facility from 'src/app/models/facility';
import {MenService} from '../../men.service';
import {SessionService} from 'src/app/_services/session.service';
import {RequestType} from 'src/app/models/request';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';

@Component({
  selector: 'app-ticket-add',
  templateUrl: './ticket-add.component.html',
  styleUrls: ['./ticket-add.component.css']
})
export class TicketAddComponent implements OnInit {
  contactInput$ = new Subject<string>();
  staffInput$ = new Subject<string>();

  categories: Category[];
  requestTypes: Observable<RequestType[]>;
  facility: Facility;
  form: FormGroup;
  subscription: Subscription;
  users: User[];

  statuses: any[];
  submitted: boolean;

  constructor(
    private appService: AppService,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private menService: MenService,
    private maintenanceService: MaintenanceService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private settingsCompanyService: SettingsCompanyService,
    private sharedService: SharedService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params.facility;

    this.statuses = this.appService.statuses;
    
    this.initForm();
    this.getCategories();
    this.getFacility(id);

    const interventionCategory = +this.settingsCompanyService.getCompanyDefaultSettings('default_men_intervention_category');
    this.requestTypes = this.maintenanceService.getTypes({type: 'all'}, interventionCategory).pipe(
      tap((types) => {
        if (types.length) {
          this.form.patchValue({request_type_id: types[0].id});
        }
      })
    );
  }

  onSelectCategory(event) {
    if (event) {
      this.form.patchValue({
        title: event.name
      });
    }
  }

  onSelectContact(event) {
    if (!event.id) {
      this.sharedService.updateSidePanel(true);
    }
  }

  setContact(contact): void {
    const value = this.form.get('contact').value;

    this.form.patchValue({
      contact: !value ? [contact] : value.concat([contact])
    });
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const body:any = {
        category_id: formValue.category.id,
        category_name: formValue.category.name,
        description: formValue.description,
        due_at: moment().format(),
        facility_id: this.facility.id,
        request_type_id: formValue.request_type_id,
        requested_at: moment(formValue.requested_at).format(),
        room_id: formValue.room ? formValue.room.id : null,
        status: formValue.status,
        title: formValue.title,
        type: 'INSURANCE',
        Staffs: formValue.staff,
        Contacts: formValue.contact
      };

      this.maintenanceService.create(body)
        .toPromise()
        .then(res => {
          this.router.navigate(['/men/ticket/detail', res.id]);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  contact$ = concat(
    of([]),
    this.contactInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.contactService.select(term)
        .toPromise()
        .then(res => {
          return res.length > 0 ? res : [{id: null, name: 'Ajouter'}];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  staff$ = concat(
    of([]),
    this.staffInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => !term || term.length < 3 ? [] : this.userService.select(term, 'selectByCompany')
        .then(res => {
          return res.length > 0 ? res : [null];
        })
        .catch(err => this.notification.error(null, err.error))
      )
    )
  );

  private getCategories() {
    this.categoryService.list({type: 'maintenance'})
      .toPromise()
      .then(res => this.categories = res)
      .catch(err => this.notification.error(null, err.error));
  }

  private getFacility(id) {
    this.menService.search({
      id,
      action: 'search'
    })
      .then(res => {
        this.facility = res;
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    const user = this.sessionService.getUser();

    this.submitted = false;
    this.form = this.formBuilder.group({
      contact: null,
      category: [null, Validators.required],
      description: [null, Validators.required],
      order_number: null,
      requested_at: new Date(),
      request_type_id: [null, Validators.required],
      room: null,
      staff: [
        [user], Validators.required
      ],
      status: ['APPROVED', Validators.required],
      title: [null, Validators.required]
    });
  }
}
