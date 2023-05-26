import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {concat, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';

import _orderBy from 'lodash.orderby';

import Account from 'src/app/models/account';
import Company from 'src/app/models/company';
import Category from 'src/app/models/category';
import Role from 'src/app/models/role';
import Room from 'src/app/models/room';

import {NotificationService} from 'src/app/_services/notification.service';
import {SettingsCompanyService} from '../settings-company.service';
import {AccountService} from 'src/app/accounting/account/account.service';
import {AppService} from 'src/app/app.service';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {FileUploader} from 'ng2-file-upload';
import {SessionService} from 'src/app/_services/session.service';
import {UtilityService} from 'src/app/_services/utility.service';
import {MaintenanceService} from 'src/app/maintenance/maintenance.service';
import {RequestType} from 'src/app/models/request';
import {ItemService} from 'src/app/accounting/item/item.service';
import {ContactService} from 'src/app/contact/contact.service';
import {InventoryStorage} from 'src/app/models/item';
import {SettingsStructureStorageService} from '../../structure/storage/settings-structure-storage.service';
import {RoomService} from 'src/app/_services/room.service';
import {RoleService} from '../../role/role.service';

@Component({
  selector: 'app-company-add',
  templateUrl: './settings-company-add.component.html'
})
export class SettingsCompanyAddComponent implements OnInit {
  addCompanyForm: FormGroup;

  searchItem$ = new Subject<string>();

  accounts: Account[] = [];
  categories: Category[] = [];
  requestTypes: RequestType[] = [];
  requestCategories: Category[] = [];
  expenseCategories: Category[] = [];
  otherCategories: Category[] = [];
  uploader: FileUploader;
  activeMenu: any;

  rooms = new Array<Room>();
  roles: Array<Role>;
  inventoryStorages: InventoryStorage[];

  items$ = concat(
    of([]),
    this.searchItem$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(term => this.itemService.select(term))
    )
  )

  company;
  paymentMethods;
  searchPaymentMethod;
  submitted;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private settingsCompanyService: SettingsCompanyService,
    private appService: AppService,
    private accountService: AccountService,
    private categoryService: CategoryService,
    private notification: NotificationService,
    private contactService: ContactService,
    private requestService: MaintenanceService,
    private roleService: RoleService,
    private itemService: ItemService,
    private sessionService: SessionService,
    private roomService: RoomService,
    private storageService: SettingsStructureStorageService,
    private utilityService: UtilityService
  ) { }

  ngOnInit() {
    this.paymentMethods = this.appService.paymentMethods;
    this.activeMenu = this.sessionService.getActiveMenu();
    this.initForm();

    Promise.all([
      this.getAccounts(),
      this.getCategories(),
      this.getTypes(),
      this.getStorages(),
      this.getRooms(),
      this.fetchRoles()
    ]).finally(() => {
      this.setupCompany();
    })
  }

  save() {
    this.submitted = true;

    if (this.addCompanyForm.valid) {
      const formValues = this.addCompanyForm.getRawValue();

      if (this.company) {
        const body: Company = new Company({
          domain: formValues.domain,
          enabled: formValues.enabled,
          Settings: {}
        });

        for (const [key, value] of Object.entries(formValues)) {
          body.Settings['general.' + key] = value && value.hasOwnProperty('id') ? value['id'] : value;
        }

        delete body.Settings['general.enabled'];
        delete body.Settings['general.domain'];


        this.settingsCompanyService.update(body)
          .toPromise()
          .then(res => {
            this.router.navigate(['/settings/company']);
            this.notification.success(null, 'UPDATE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err));
      }
      else {
        const body: Company = new Company({
          domain: formValues.domain,
          enabled: formValues.enabled,
          Settings: [
            {
              key: 'general.company_tos',
              value: formValues.company_tos
            },
            {
              key: 'general.company_email',
              value: formValues.company_email
            },
            {
              key: 'general.default_account',
              value: formValues.default_account
            },
            {
              key: 'general.default_provider',
              value: formValues.default_provider ? formValues.default_provider.id: null
            },
            {
              key: 'general.default_currency',
              value: formValues.default_currency
            },
            {
              key: 'general.default_payment_method',
              value: formValues.default_payment_method
            },
            {
              key: 'general.company_name',
              value: formValues.company_name
            },
            {
              key: 'general.company_contact_id',
              value: formValues.company_contact ? formValues.company_contact.id: null
            },
            {
              key: 'general.company_contact_name',
              value: formValues.company_contact ? formValues.company_contact.name: null
            },
            {
              key: 'general.company_RCS',
              value: formValues.company_RCS
            },
            {
              key: 'general.company_phone',
              value: formValues.company_phone
            },
            {
              key: 'general.company_STAT',
              value: formValues.company_STAT
            },
            {
              key: 'general.company_NIF',
              value: formValues.company_NIF
            },
            {
              key: 'general.company_address_line_1',
              value: formValues.company_address_line_1
            },
            {
              key: 'general.company_address_line_2',
              value: formValues.company_address_line_2
            },
            {
              key: 'general.company_address_line_3',
              value: formValues.company_address_line_3
            },
            {
              key: 'general.default_timeline_event_type',
              value: formValues.default_timeline_event_type
            },
            {
              key: 'general.default_men_insurance_item',
              value: formValues.default_men_insurance_item ? formValues.default_men_insurance_item.id: null
            },
            {
              key: 'general.default_men_intervention_category',
              value: formValues.default_men_intervention_category
            },
            {
              key: 'general.default_inventory_category',
              value: formValues.default_inventory_category
            },
            {
              key: 'general.default_inventory_transfer_category',
              value: formValues.default_inventory_transfer_category
            },
            {
              key: 'general.default_inventory_out_category',
              value: formValues.default_inventory_out_category
            },
            {
              key: 'general.default_inventory_out_type',
              value: formValues.default_inventory_out_type
            },
            {
              key: 'general.default_inventory_order_type',
              value: formValues.default_inventory_order_type
            },
            {
              key: 'general.default_inventory_room',
              value: formValues.default_inventory_storage
            },
            {
              key: 'general.default_inventory_storage',
              value: formValues.default_inventory_storage
            },
            {
              key: 'general.default_tracker_category',
              value: formValues.default_tracker_category
            },
            {
              key: 'general.default_health_diagnostic_category',
              value: formValues.default_health_diagnostic_category
            },
            {
              key: 'general.default_health_consultation_category',
              value: formValues.default_health_consultation_category
            },
            {
              key: 'general.default_health_category',
              value: formValues.default_health_category
            },
            {
              key: 'general.default_bill_category',
              value: formValues.default_bill_category
            },
            {
              key: 'general.default_bill_inventory_transfer_category',
              value: formValues.default_bill_inventory_transfer_category
            },
            {
              key: 'general.default_invoice_category',
              value: formValues.default_invoice_category
            }
          ]
        });

        this.settingsCompanyService.create(body)
          .toPromise()
          .then(res => {
            this.router.navigate(['/settings/company']);
            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => {
            this.notification.error(null, err);
          });
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  uploadFile(type: 'logo' | 'signature') {
    this.uploader = new FileUploader({
      url: this.utilityService.getUploadUrl(type, 'COMPANY'),
      method: 'POST',
      headers: [
        {name: 'X-Access-Token', value: this.sessionService.getToken()}
      ],
      autoUpload: true
    });
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader.onSuccessItem = (file, response, status, header) => {
      this.notification.success(null, 'UPLOAD_SUCCESS');
    };
  }

  private fetchRoles() {
    this.roleService.list().pipe(
      map(items => _orderBy(items, ['id'], ['asc']))
    ).toPromise().then(res => this.roles = res);
  }

  private initForm() {
    this.addCompanyForm = this.formBuilder.group({
      domain: [null, Validators.required],
      enabled: true,
      company_tos: null,
      company_name: [null, Validators.required],
      company_contact: null,
      company_email: null,
      company_meta: null,
      company_phone: [null, Validators.required],
      company_STAT: null,
      company_NIF: null,
      company_RCS: null,
      company_address_line_1: null,
      company_address_line_2: null,
      company_address_line_3: null,
      default_account: null,
      default_provider: null,
      default_men_insurance_item: null,
      default_timeline_event_type: null,
      default_men_intervention_category: null,
      default_inventory_category: null,
      default_inventory_transfer_category: null,
      default_inventory_out_category: null,
      default_inventory_out_type: null,
      default_inventory_order_type: null,
      default_inventory_room: null,
      default_inventory_storage: null,
      default_tracker_category: null,
      default_health_diagnostic_category: null,
      default_health_consultation_category: null,
      default_health_category: null,
      default_bill_category: null,
      default_bill_inventory_transfer_category: null,
      default_currency: [null, Validators.required],
      default_invoice_category: null,
      default_payment_method: null,
      'sms.cash_desk': null,
      'sms.sp': null
    });
  }

  private getAccounts() {
    return this.accountService.list({type: 'all'})
      .toPromise()
      .then(accounts => this.accounts = accounts)
  }

  private getCategories() {
    return Promise.all(
      [
        this.categoryService.list({type: 'income'})
          .toPromise()
          .then(categories => this.categories = categories),
        this.categoryService.list({type: 'expense'})
          .toPromise()
          .then(categories => this.expenseCategories = categories),
        this.categoryService.list({type: 'maintenance'})
          .toPromise()
          .then(categories => this.requestCategories = categories),
        this.categoryService.list({type: 'other'})
          .toPromise()
          .then(categories => this.otherCategories = categories)
      ]
    );
  }

  private getRooms() {
    this.roomService.getRooms().then(rooms => {
      this.rooms = rooms;
    })
  }

  private getStorages() {
    this.storageService.list().toPromise()
      .then(storages => {
        this.inventoryStorages = storages;
      })
  }

  private getTypes() {
    return this.requestService.getTypes({type: 'all'}).toPromise().then(types => {
      this.requestTypes = types;
    });
  }

  private setupCompany() {
    const company_id = this.route.snapshot.paramMap.get('id');

    if (company_id) {
      this.settingsCompanyService.get(company_id)
        .toPromise()
        .then(res => {
          this.company = new Company(res);

          setTimeout(() => {
            this.addCompanyForm.patchValue({
              domain: res.domain,
              enabled: res.enabled
            });

            for (const [key, value] of Object.entries(res.Settings)) {
              const item = {};
              item[key.replace('general.', '')] = value;
              this.addCompanyForm.patchValue(item);
            }

            if (res.Settings['general.default_men_insurance_item']) {
              this.itemService.get(+res.Settings['general.default_men_insurance_item']).toPromise().then(item => {
                this.addCompanyForm.patchValue({default_men_insurance_item: item});
              }).catch(err => this.notification.error(null, err.error));
            }

            if (res.Settings['general.default_provider']) {
              this.contactService.get(+res.Settings['general.default_provider']).toPromise().then(contact => {
                this.addCompanyForm.patchValue({default_provider: contact});
              }).catch(err => this.notification.error(null, err.error));
            }

            if (res.Settings['general.company_contact_id']) {
              this.contactService.get(+res.Settings['general.company_contact_id']).toPromise().then(contact => {
                this.addCompanyForm.patchValue({company_contact: contact});
              }).catch(err => this.notification.error(null, err.error));
            }
          }, 1000);
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
  }
}
