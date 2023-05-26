import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concat, Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';
import Request from 'src/app/models/request';
import { UserService } from 'src/app/settings/user/user.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { PrintService } from 'src/app/_services/print.service';
import { UtilityService } from 'src/app/_services/utility.service';
import { ADMINISTRATION_MODES, HealthService } from '../../health.service';

import _cloneDeep from 'lodash.clonedeep';
import { SessionService } from 'src/app/_services/session.service';
import { SharedService } from 'src/app/_services/shared.service';
import Item, { InventoryStorage, ItemInventory, ItemUnit } from 'src/app/models/item';
import { InventoryService } from 'src/app/inventory/inventory.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {Confirmable} from 'src/app/shared/decorators/confirmable.decorator';
import {AppendItemModalComponent} from 'src/app/ui-elements/modals/append-item-modal/append-item-modal.component';

@Component({
  selector: 'app-health-detail-document',
  templateUrl: './health-detail-document.component.html',
  styleUrls: ['./health-detail-document.component.css']
})
export class HealthDetailDocumentComponent implements OnInit, OnDestroy {

  modes = ADMINISTRATION_MODES;
  
  @Input()
  documentId: number;
  @Input()
  isModal: boolean;

  staffInput$ = new Subject<string>();
  staff$: Observable<any[]>;
  inventoryUnits: ItemUnit[];
  contactId: number;
  document: Request;
  submitted: boolean;
  submittedPrescription: boolean;

  requestForm: FormGroup;
  prescriptionForm: FormGroup;
  diagnosticCodesTree: HealthDiagnosticCodeNode[];

  subscription = new Subscription();
  inventoryStorages: InventoryStorage[] = [];

  editMode: boolean = false;

  items: Item[] = [];

  items$ = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
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

  constructor(private route: ActivatedRoute,
              private printService: PrintService,
              private notification: NotificationService,
              private healthService: HealthService,
              private userService: UserService,
              private formBuilder: FormBuilder,
              private router: Router,
              private modalService: NgbModal,
              private inventoryService: InventoryService,
              private sessionService: SessionService,
              private sharedService: SharedService,
              private utilityService: UtilityService,
              private maintenanceService: MaintenanceService
  ) {
  }

  get RequestItems() {
    return this.prescriptionForm.get('RequestItems') as FormArray;
  }

  get isCompleted() {
    if (!this.document) return false;
    return this.document.status === 'COMPLETED';
  }

  ngOnInit() {
    this.initForm();
    this.loadParams();
    this.pushToHistory();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addProduct() {
    const company_id = this.sessionService.getCompanyId();
    const fg = this.formBuilder.group({
      id: null,
      item: [null, Validators.required],
      item_id: [null, Validators.required],
      item_type: 'ASSET',
      company_id: company_id,
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: 0,
      units: null,
      unit_id: [null, Validators.required],
      storage_id: [null, Validators.required],
      dosage: [null, Validators.required],
      administration_mode: [null, Validators.required],
      duration: [null, Validators.required],
      state: 'NEW',
      total: 0,
      sku: ''
    });

    this.submittedPrescription = false;
    this.editMode = true;

    this.RequestItems.push(fg);
  }

  appendProduct() {
    if (this.editMode) {
      this.submittedPrescription = true;
      if (this.RequestItems.valid) {
        const requestItem = this.RequestItems.controls[this.RequestItems.length - 1];
        if (requestItem) {
          let item = requestItem.value;
          this.saveIndividualItem(item);
        }
      }
    }
    else {
      this.addProduct();
    }
  }

  bgColor = (status) => this.utilityService.statusStyle(status).background;

  close() {
    if (this.isModal) {
      this.modalService.dismissAll();
    }
    else {
      this.router.navigate(['/health/detail', this.contactId]);
    }
  }

  onAddStaff(event) {
    if (event.id) {
      this.maintenanceService.updateBy(this.document.id, {staff_id: event.id}, 'staff')
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else console.log('User not found!');
  }

  onRemoveStaff(event) {
    this.maintenanceService.removeBy(this.document.id, 'staff', event.value.id)
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  openAppendModal() {
    const modal = this.modalService.open(AppendItemModalComponent, {
      size: 'md' as any
    });

    modal.componentInstance.roomId = this.document.meta && this.document.meta.source_room_id ? this.document.meta.source_room_id: null;
    modal.componentInstance.type = 'HEALTH';
    modal.result.then(item => {
      this.saveIndividualItem(item);
    }).catch(() => {
      console.log('Dismissed');
    });
  }

  @Confirmable({title: 'Supprimer le produit'})
  removeProduct(index: number, id: number) {
    if (!id) {
      this.RequestItems.removeAt(index);
      this.editMode = false;
    }
    else {
      this.maintenanceService.removeItem(this.document.id, id).toPromise().then(() => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      }).catch(err => this.notification.error(null, err.error));
    }
  }

  print() {
    if (this.document.RequestType.meta.route === '/health/consultation') {
      this.printService.medicalConsultation(this.document);
    }
    else {
      this.printService.medicalDiagnostic(this.document, this.diagnosticCodesTree, this.document.RawCodes);
    }
  }

  resetForm() {
    this.submitted = false;

    this.requestForm.reset({
      status: 'DRAFT'
    });

    while (this.RequestItems.length) {
      this.RequestItems.removeAt(0);
    }

    this.loadDocument(this.document.id);
  }

  saveDocument() {
    this.submitted = true;
    if (this.requestForm.valid) {
      const formValue = this.requestForm.getRawValue();

      let conclusion = formValue.comments as string;
      if (conclusion) {
        conclusion = conclusion.trim();
        if (conclusion.length > 1) {
          conclusion = conclusion.replace(/\s{2,}/g, ' ');
          // conclusion = conclusion.charAt(0).toUpperCase() + conclusion.charAt(1).toLowerCase();
        }
      }

      const body:any = Object.assign({}, formValue, {
        id: this.document.id,
        comments: conclusion,
        meta: {
          ...this.document.meta,
          medical_guidance: formValue.medical_guidance,
          pedagogical_guidance: formValue.pedagogical_guidance,
          observation: formValue.observation
        }
      });

      delete body.Facility;
      delete body.pedagogical_guidance;
      delete body.medical_guidance;

      this.maintenanceService.update(body)
        .toPromise()
        .then(() => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(err, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  saveIndividualItem(item: any) {
    item = {
      ...item,
      request_id: this.document.id
    };

    delete item.units;

    this.maintenanceService.addItem(this.document.id, item).toPromise().then(() => {
      this.resetForm();
      this.notification.success(null, 'SAVE_SUCCESS');
      this.editMode = false;
    }).catch(err => {
      console.log(err);
      this.notification.error(null, err.error);
    });
  }

  savePrescription() {
    this.submittedPrescription = true;

    if (this.prescriptionForm.valid) {
      const prescription = this.prescriptionForm.getRawValue();
      let items = prescription.RequestItems as any[];

      if (items && items.length > 0) {
        items = items.map(item => {
          return {
            ...item,
            unit_id: item.unit? item.unit.id: null,
            request_id: this.document.id, // remove later
            meta: {
              dosage: item.dosage,
              administration_mode: item.administration_mode,
              duration: item.duration
            }
          };
        });

        let apiCall: Observable<any>;
        const id = this.document.id;
        const params = { RequestItems: items };

        if (this.document.RequestItems.length > 0) {
          apiCall = this.maintenanceService.updateItemsByUnit(id, params);
        }
        else {
          apiCall = this.maintenanceService.addItemsByUnit(id, params);
        }


        apiCall.toPromise()
          .then(() => {
            this.resetForm();
            this.notification.success(null, 'UPDATE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  updateStatus(status) {
    const params = {
      id: this.document.id,
      status: status
    };

    this.maintenanceService.updateStatus(params)
      .toPromise()
      .then(() => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(err, err.error));
  }

  private arrayToForm(array: any[]): void {
    if (!array) {
      return;
    }
  
    while(this.RequestItems.length) {
      this.RequestItems.removeAt(0);
    }

    array.forEach(item => {
      const fg = {
        ...item,
        item,
        ...item.meta
      };

      this.RequestItems.push(this.formBuilder.group(fg));
    });
  }
  
  private loadDocument(id: number) {
    this.healthService.get(id).then(doc => {
      if (doc.RequestType) {
        this.document = doc;
        return this.healthService.getHealthTree(this.document.RequestType.id).then(tree => {
          this.diagnosticCodesTree = tree;
          this.document.RawCodes = _cloneDeep(this.document.HealthDiagnosticCodes);
          this.document.HealthDiagnosticCodes = HealthService.mapTreeToTrackers(this.diagnosticCodesTree, this.document.HealthDiagnosticCodes);

          setTimeout(() => {
            this.requestForm.patchValue(
              Object.assign(
                {},
                doc,
                {
                  requested_at: doc.requested_at ? new Date(doc.requested_at) : null,
                  Facility: doc.Facility || null,
                  staff: doc.Staffs.map(item => Object.assign({}, item, {disabled: true}))
                },
                ...doc.meta
              )
            )
          }, 1000);

          this.arrayToForm(doc.RequestItems);
          this.editMode = false;
        });
      }
      else {
        this.notification.error(null, 'TYPE_NOT_FOUND');
      }
    }).catch(err => {
      this.notification.error(null, err.error);
    });
  }

  private loadParams() {
    if (!this.isModal) {
      this.contactId = +this.route.parent.snapshot.params['id'];

      const idParam = this.route.snapshot.params['id'];

      if (idParam && !isNaN(+idParam)) {
        this.documentId = +idParam;
      }
      else {
        this.notification.error(null, 'ID_NOT_FOUND');
      }
    }
  }

  private initForm() {
    this.staff$ = concat(
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

    this.submitted = false;
    this.requestForm = this.formBuilder.group({
      requested_at: null,
      RequestType: null,
      Facility: [null, Validators.required],
      staff: [null, Validators.required],
      status: 'DRAFT',
      comments: null,
      medical_guidance: null,
      pedagogical_guidance: null,
      observation: null,
    });

    this.prescriptionForm = this.formBuilder.group({
      RequestItems: this.formBuilder.array([])
    })
  }

  private pushToHistory() {
    const params =  {
      description: 'Ouverture du dossier',
      id: this.documentId
    }
    this.maintenanceService.addHistory(params).toPromise().then(() => {
      this.setup();
    }).catch(err => this.notification.error(null, err.error));
  }

  private setup() {
    this.inventoryService.getItemUnits().then(units => {
      this.inventoryUnits = units;
      this.loadDocument(this.documentId);
    }).catch(err => this.notification.error(null, err.error));
  }

}
