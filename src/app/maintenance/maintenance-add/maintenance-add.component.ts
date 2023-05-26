import {Component, OnInit} from '@angular/core';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subject, Subscription, concat, of, Observable} from 'rxjs';
import {Router} from '@angular/router';

import * as moment from 'moment';

import Category from 'src/app/models/category';
import Item from 'src/app/models/item';
import Room from 'src/app/models/room';

import {AppService} from 'src/app/app.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {ContactService} from 'src/app/contact/contact.service';
import {RoomService} from 'src/app/_services/room.service';
import {MaintenanceService} from '../maintenance.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SharedService} from 'src/app/_services/shared.service';
import {UserService} from 'src/app/settings/user/user.service';
import {SessionService} from 'src/app/_services/session.service';
import {RequestType} from 'src/app/models/request';

@Component({
  selector: 'app-maintenance-add',
  templateUrl: './maintenance-add.component.html',
  styleUrls: ['./maintenance-add.component.css', '../../../assets/scss/plugins/_datepicker.scss']

})
export class MaintenanceAddComponent implements OnInit {
  contactInput$ = new Subject<string>();
  staffInput$ = new Subject<string>();

  categories: Observable<Category[]>;
  items: Array<Item> = [];
  requestForm: FormGroup;
  rooms: Promise<Room[]>;
  subscription: Subscription;

  statuses: any[];
  submitted: boolean;

  types: Observable<RequestType[]>;

  constructor(
    private appService: AppService,
    private categoryService: CategoryService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private maintenanceService: MaintenanceService,
    private notification: NotificationService,
    private roomService: RoomService,
    private router: Router,
    private sessionService: SessionService,
    private sharedService: SharedService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.statuses = this.maintenanceService.statuses;
    this.categories = this.categoryService.list({type: 'maintenance'});
    this.rooms = this.roomService.getRooms();
    this.types = this.maintenanceService.getTypes({type: 'all'});

    this.initForm();
    this.subscribe();
  }

  onSelectContact(event) {
    if (!event.id) {
      this.sharedService.updateSidePanel(true);
      setTimeout(() => {
        const contactFA = this.requestForm.get('contact') as FormArray;
        if (contactFA) {
          const contacts = contactFA.value as any[];
          if (contacts && contacts.length) {
            contactFA.setValue(contacts.filter((item) => item.id));
          }
        }
      }, 0);
    }
  }

  onSelectUser(event): void {
    event.preventDefault();

    if (event.item) {
      this.requestForm.patchValue({
        staff_id: event.item.id,
        staff_name: event.item.name
      });
    }
  }

  save() {
    this.submitted = true;

    if (this.requestForm.valid) {
      const formValue = this.requestForm.getRawValue();
      const maintenance = {
        category_id: formValue.category.id,
        category_name: formValue.category.name,
        description: formValue.description,
        due_at: moment(formValue.due_at).format(),
        requested_at: moment(formValue.requested_at).format(),
        room_id: formValue.room ? formValue.room.id : null,
        status: formValue.status,
        title: formValue.title,
        type: formValue.type,
        request_type_id: formValue.request_type_id,
        Contacts: formValue.contact,
        Staffs: formValue.staff
      };

      this.maintenanceService.create(maintenance)
        .toPromise()
        .then(res => {
          this.router.navigate(['maintenance']);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(err, err.message));
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

  subscribe() {
    this.subscription = this.sharedService.contact$.subscribe(contact => {
      if (contact) {
        this.requestForm.patchValue({
          contact_id: contact.id,
          contact_name: contact.name
        });
      }
    });
  }

  get RequestItems(): FormArray {
    return this.requestForm.get('RequestItems') as FormArray;
  }

  private initForm() {
    const user = this.sessionService.getUser();

    this.submitted = false;
    this.requestForm = this.formBuilder.group({
      bill_id: null,
      category: [null, Validators.required],
      contact: null,
      description: [null, Validators.required],
      due_at: new Date(),
      order_number: null,
      requested_at: new Date(),
      reservation_id: null,
      request_type_id: null,
      room: null,
      staff: [
        [user], Validators.required
      ],
      status: [null, Validators.required],
      title: [null, Validators.required],
      type: [null, Validators.required]
    });
  }
}

