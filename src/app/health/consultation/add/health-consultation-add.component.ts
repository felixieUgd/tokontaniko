import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { concat, Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { AppService } from 'src/app/app.service';
import { MenService } from 'src/app/men/men.service';
import { ADMINISTRATION_MODES, HealthService } from '../../health.service';
import { ContactService } from 'src/app/contact/contact.service';
import { SharedService } from 'src/app/_services/shared.service';
import { SessionService } from 'src/app/_services/session.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import { CategoryService } from 'src/app/accounting/category/category.service';
import { SettingsCompanyService } from 'src/app/settings/company/settings-company.service';

import Request from 'src/app/models/request';
import Contact from 'src/app/models/contact';
import Facility from 'src/app/models/facility';
import Category from 'src/app/models/category';
import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from 'src/app/inventory/inventory.service';
import Item, { ItemInventory, ItemUnit } from 'src/app/models/item';
import Room from 'src/app/models/room';

@Component({
  selector: 'app-health-consultation-add',
  templateUrl: './health-consultation-add.component.html',
  styleUrls: ['./health-consultation-add.component.css']
})
export class HealthConsultationAddComponent implements OnInit, OnDestroy {
  modes = ADMINISTRATION_MODES;

  identityForm: FormGroup;
  prescriptionForm: FormGroup;
  selectedStudent: Contact;

  submitted: boolean;
  submittedPrescription: boolean;
  submittedDescription: boolean;

  requestTypeId: number;

  sourceRoom: Room;

  inventoryUnits: ItemUnit[];
  previousRequests: Request[];
  healthDiagnosticCodes: HealthDiagnosticCodeNode[];

  minDate: any;
  maxDate: any;

  step: number;

  items: Item[] = [];

  Category: Category;

  subscription = new Subscription();

  formatter = (item: Facility) => {
    return item.name;
  }

  searchContact = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => {
        this.identityForm.get('id').setValue(null);

        if (term.length < 3) {
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

  searchItem = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(term => term.length <= 3 ? [] :
        this.inventoryService.select(term)
          .toPromise()
          .then(res => {
            return res.length > 0 ? res : [null];
          })
          .catch(err => {
            this.notification.error(null, err.error);
            return [];
          })
      )
    );

  constructor(public menService: MenService,
              private appService: AppService,
              private formBuilder: FormBuilder,
              private sharedService: SharedService,
              private notification: NotificationService,
              private contactService: ContactService,
              private route: ActivatedRoute,
              private inventoryService: InventoryService,
              private sessionService: SessionService,
              private router: Router,
              private categoryService: CategoryService,
              private healthService: HealthService,
              private maintenanceService: MaintenanceService,
              private settingsCompanyService: SettingsCompanyService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.requestTypeId = Number(navigation.extras.state.request_type_id);
    }

    this.prescriptionForm = this.formBuilder.group({
      comments: null,
      medical_guidance: null,
      pedagogical_guidance: null,
      observation: null,
      RequestItems: this.formBuilder.array([])
    });
  }

  get RequestItems() {
    return this.prescriptionForm.get('RequestItems') as FormArray;
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
    this.subscription.unsubscribe();
  }

  addProduct() {
    const company_id = this.sessionService.getCompanyId();
    const fg = this.formBuilder.group({
      item: [null, Validators.required],
      item_id: [null, Validators.required],
      item_type: 'GOODS',
      company_id: company_id,
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: 0,
      storage_id: [null, Validators.required],
      units: null,
      unit: [null, Validators.required],
      dosage: [null, Validators.required],
      administration_mode: [null, Validators.required],
      duration: [null, Validators.required],
      state: 'NEW',
      total: 0,
      sku: ''
    });

    this.submittedPrescription = false;

    this.RequestItems.push(fg);
  }

  checkIdentity() {
    this.submitted = true;
    if (this.identityForm.valid) {
      const formValue = this.identityForm.getRawValue();
      const newValue = {
        name: formValue.name,
        sex: formValue.sex,
        bio_dob: moment(formValue.bio_dob).format('YYYY-MM-DD'),
        parent_1: formValue.parent_1,
        parent_2: formValue.parent_2,
        address: formValue.address,
        tutor: formValue.tutor,
        school_serial: formValue.school_serial,
        school_grade: formValue.school_grade
      }

      const body = Object.assign({}, this.selectedStudent, {
        name: newValue.name,
        address: newValue.address,
        sex: newValue.sex,
        bio_dob: newValue.bio_dob,
        parent_id: newValue.parent_1 ? newValue.parent_1.id : null
      });

      body.meta = body.meta || {};
      body.meta.school_serial = newValue.school_serial;
      body.meta.school_grade = newValue.school_grade;

      body.meta.parent_2 = newValue.parent_2 ? {
        id: newValue.parent_2 ? newValue.parent_2.id : null,
        name: newValue.parent_2 ? newValue.parent_2.name : null,
        address: body.meta.parent_2 ? body.meta.parent_2.address : null
      } : null;
      body.meta.tutor = newValue.tutor ? {
        id: newValue.tutor ? newValue.tutor.id : null,
        name: newValue.tutor ? newValue.tutor.name : null,
        address: body.meta.tutor ? body.meta.tutor.tutor_address : null
      } : null;

      this.contactService.update(body)
        .toPromise()
        .then(() => {
          const filter = {
            request_type_id: [
              {
                value: this.requestTypeId,
                operator: "equals",
                type: "number"
              }
            ]
          }
          return this.healthService.listByContact(formValue.id, filter).then(requests => {
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
          });
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  checkProduct() {
    this.submittedPrescription = true;
    if (this.prescriptionForm.valid) {
      this.setStep(this.step + 1);
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
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

  onSelectItem = (event, group): void => {
    let clear = true;
    if (event && event.id) {
      if (event.available && event.available.quantity) {
        clear = false;

        group.patchValue({
          item_id: event.id,
          item_type: event.type,
          name: event.name,
          price: event.sale_price || 0,
          units: event.Inventories.map((inventory: ItemInventory) => {

            return {
              id: inventory.unit_id,
              name: inventory.ItemUnit.name,
              storage_id: inventory.InventoryStorage ? inventory.InventoryStorage.id : null,
              remainingQuantity: inventory.quantity
            }
          }),
          total: 0
        });
      }
      else {
        this.notification.error(null, 'ITEM_OUT_OF_STOCK');
      }
    }

    if (clear) {
      group.patchValue({
        item: null,
        item_id: null,
        item_type: null,
        units: null,
        unit_id: null,
        price: 0,
        name: null,
        storage_id: null
      });
    }
  }

  onSelectUnit = (event, group): void => {
    group.patchValue({
      unit_id: event ? event.id : null,
      storage_id: event ? event.storage_id : null
    });
  }

  removeProduct(index: number) {
    this.RequestItems.removeAt(index);
  }

  saveAll() {
    const identity = this.identityForm.getRawValue();
    const prescription = this.prescriptionForm.getRawValue();
    let items = prescription.RequestItems as any[];

    const user = this.sessionService.getUser();
    const month = moment().format('MMMM');
    const year = moment().format('YYYY');

    const name = 'Consultation médicale - ' + month + ' ' + year;

    let conclusion = prescription.comments as string;
    if (conclusion) {
      conclusion = conclusion.trim();
      if (conclusion.length > 1) {
        conclusion = conclusion.replace(/\s{2,}/g, ' ');
        // conclusion = conclusion.charAt(0).toUpperCase() + conclusion.charAt(1).toLowerCase();
      }
    }

    const request = new Request({
      title: name,
      category_id: this.Category ? this.Category.id : null,
      category_name: this.Category ? this.Category.name : null,
      description: name,
      comments: conclusion,
      meta: {
        source_room_id: this.sourceRoom ? this.sourceRoom.id: null,
        medical_guidance: prescription.medical_guidance,
        pedagogical_guidance: prescription.pedagogical_guidance,
        observation: prescription.observation,
      },
      requested_at: new Date().toISOString(),
      facility_id: identity.Facility.id,
      request_type_id: this.requestTypeId,
      type: 'HEALTH',
      status: 'APPROVED',
      Staffs: [
        {
          id: user.id
        }
      ],
      Contacts: [
        {
          id: identity.id
        }
      ]
    });

    const trackers = HealthService.generateTrackers(this.healthDiagnosticCodes);
    this.maintenanceService
      .create(request)
      .toPromise()
        .then(async (created) => {
          await this.healthService.createTrackers(created.id, trackers);
          if (items && items.length > 0) {
            items = items.map(item => {
              return {
                ...item,
                unit_id: item.unit? item.unit.id: null,
                request_id: created.id, //remove later
                meta: {
                  dosage: item.dosage,
                  administration_mode: item.administration_mode,
                  duration: item.duration
                }
              };
            });

            await this.maintenanceService
              .addItemsByUnit(created.id, { RequestItems: items })
              .toPromise()
              .then()
              .catch(err => this.notification.error(null, err.error));
          }
          
          this.identityForm.reset();
          this.prescriptionForm.reset();
          this.submitted = false;
          this.notification.success(null, 'SAVE_SUCCESS');
          this.router.navigate(['/health/detail/' + this.selectedStudent.id + '/document', created.id]);
        })
        .catch(err => this.notification.error(null, err.error));
  }

  setItemsByRoom(room: Room) {
    this.sourceRoom = room;
    if (room) {
      this.inventoryService.getInventoryByRoom(room.id, this.items).then(() => {
        if (this.items) {
          this.items = this.items.slice(0);
        }
        else {
          this.notification.error(null, 'ITEMS_NOT_SET');
        }
      });
    }
    else {
      this.items = [];
    }
  }

  setStepFromTimeline(target: number) {
    if (this.step > target) {
      this.setStep(target);
    }
  }

  setStep(step: number) {
    document.querySelector('.page-container').scrollTop = 0;

    this.healthService.setCurrentStep(step);
  }

  private detectDobChange() {
    this.subscription.add(
      this.identityForm.get('bio_dob').valueChanges.subscribe(date => {
        let age = moment().diff(date, 'years');
        if (!isNaN(age)) {
          this.identityForm.get('age').setValue(age.toString().concat(' ans'));
        }
      })
    );
  }

  private initForm() {
    this.identityForm = this.formBuilder.group({
      id: [null, Validators.required],
      name: [null, Validators.required],
      age: null,
      sex: [null, Validators.required],
      school_grade: [null, Validators.required],
      school_serial: null,
      address: [null, Validators.required],
      bio_dob: [null, Validators.required],
      Facility: [null, Validators.required],
      parent_1: null,
      parent_2: null,
      code: [null, Validators.required],
      tutor: null
    });
  }

  private loadCategory() {
    const field = 'general.default_health_consultation_category';
    this.settingsCompanyService.getSettings(this.sessionService.getCompanyId(), [field]).toPromise().then(company => {
      const consultationId = +company.Settings[field];
      if (isNaN(consultationId)) {
        this.notification.error(null, 'CATEGORY_NOT_FOUND');
      }
      else {
        this.categoryService.get(consultationId).toPromise().then(category => {
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

      this.selectedStudent = contact;

      this.identityForm.patchValue({
        ...contact,
        school_grade: contact.meta? contact.meta.school_grade: null,
        school_serial: contact.meta? contact.meta.school_serial: null,
        parent_1: contact.Parent,
        parent_2: contact.meta? contact.meta.parent_2: null,
        tutor: contact.meta? contact.meta.tutor: null
      });
    }).catch(err => this.notification.error(null, err.error));
  }

  private loadItemUnits() {
    this.inventoryService.getItemUnits().then(units => {
      this.inventoryUnits = units;
    }).catch(err => this.notification.error(null, err.error));
  }

  private loadTree() {
    this.healthService.getHealthTree(this.requestTypeId).then(tree => {
      this.healthDiagnosticCodes = tree;
    }).catch(err => {
      this.notification.error(null, err.error);
    });
  }

  private setup() {
    this.minDate = this.appService.getMinDate();
    this.maxDate = this.appService.getMaxDate();

    this.sourceRoom = null;

    this.subscription.add(
      this.healthService.$currentStep.subscribe(step => {
        this.step = step;
      })
    );

    this.healthService.setCurrentStep(0);
    
    this.initForm();
    this.detectDobChange();
    this.loadCategory();
    this.loadItemUnits();
    this.loadTree();

    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        const idParam = params['id'];
        if (idParam && !isNaN(+idParam)) {
          this.loadContact(+idParam);
        }
      })
    );
  }

}
