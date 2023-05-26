import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NgSelectComponent} from '@ng-select/ng-select';
import {concat, EMPTY, Observable, of, Subject, Subscription, throwError} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import {ADMINISTRATION_MODES} from 'src/app/health/health.service';
import {InventoryService} from 'src/app/inventory/inventory.service';
import Item, {ItemInventory, ItemUnit} from 'src/app/models/item';
import {conditionalValidator} from 'src/app/_helpers/conditional-validator';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';

@Component({
  selector: 'app-append-item-modal',
  templateUrl: './append-item-modal.component.html',
  styleUrls: ['./append-item-modal.component.css']
})
export class AppendItemModalComponent implements OnInit, AfterViewInit, OnDestroy {
  form: FormGroup;
  submitted: boolean;

  modes = ADMINISTRATION_MODES;
  units: ItemUnit[] = [];
  taxes$ = this.taxService.list();

  subscription = new Subscription();

  @Input()
  type: 'BILL' | 'REQUEST' | 'HEALTH' | 'INVOICE' = 'REQUEST';
  @Input()
  hasTaxes: boolean = false;
  @Input()
  selected: any;

  roomId: number;
  items: Item[] = [];

  searchItem$ = new Subject<string>();

  @ViewChild('itemSelect') itemSelect: NgSelectComponent;
  @ViewChild('descriptionField') descriptionFieldRef: ElementRef<HTMLInputElement>;

  items$ = concat(
    of([]),
    this.searchItem$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (term && term.length >= 3) {
          let items: Item[] = [];
          let apiCall: Observable<ItemInventory[]>;

          if (this.roomId) {
            apiCall = this.inventoryService.selectByRoom(term, this.roomId, items);
          }
          else {
            apiCall = this.inventoryService.selectByDefaultRoom(term, items);
          }

          return apiCall.pipe(
            switchMap(() => {
              if (items) {
                return of(items);
              }
              else {
                return throwError({error: 'ITEMS_NOT_SET'});
              }
            }),
            catchError(err => {
              this.notification.error(null, err.error);
              return EMPTY;
            })
          );
        }
        else {
          return [];
        }
      })
    )
  )

  constructor(public activeModal: NgbActiveModal,
              private formBuilder: FormBuilder,
              private taxService: TaxService,
              private inventoryService: InventoryService,
              private notification: NotificationService,
              private sessionService: SessionService
  ) { }

  ngOnInit() {
    this.initForm();

    if (this.selected) {
      if (this.isInventory(this.selected.item_type)) {
        this.loadUnits();
      }
      
      this.form.patchValue(this.selected);
    }
  }

  ngAfterViewInit(): void {
    if (this.selected) {
      if (this.descriptionFieldRef) {
        this.descriptionFieldRef.nativeElement.focus();
      }
    }
    else if (this.itemSelect) {
      this.itemSelect.focus();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isInventory(type: string) {
    return type === 'GOODS' || type === 'ASSET' || type === 'SERVICES';
  }

  onSelectItem = (event: any) => {
    let clear = true;
    if (event && event.id) {
      if ((this.type === 'BILL' || (event.type === 'SERVICES' || event.available && event.available.quantity))) {
        clear = false;

        this.form.patchValue({
          item_id: event.id,
          item_type: event.type,
          name: event.name,
          price: (this.type === 'BILL' ? event.purchase_price : event.sale_price) || 0,
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
      this.form.patchValue({
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

  onSelectUnit = (event: any): void => {
    this.form.patchValue({
      storage_id: event ? event.storage_id : null
    });
  }

  save() {
    this.submitted = true;
    if (this.form.valid) {
      const value = this.form.getRawValue();
      let it = value;
  
      if (this.selected) {
        const {id, description, meta, Taxes} = value;
        it = {id, description, meta, Taxes};
      }
      else {
        delete it.item;
        delete it.units;
      }

      this.activeModal.close(it);
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private getMetaByType() {
    switch(this.type) {
      case 'HEALTH':
        return this.formBuilder.group({
          dosage: [null, Validators.required],
          administration_mode: [null, Validators.required],
          duration: [null, Validators.required]
        });
      default: 
        return null;
    }
  }

  private initForm() {
    this.form = this.formBuilder.group({
      id: null,
      item: [null, Validators.required],
      description: [null, [
        conditionalValidator(() => {
          return !!this.selected;
        }, Validators.required, 'DESCRIPTION_EMPTY')
      ]],
      item_id: [null, Validators.required],
      item_type: 'GOODS',
      company_id: this.sessionService.getCompanyId(),
      storage_id: [null, [
        conditionalValidator(() => {
          const type = this.form.get('item_type').value;
          return this.isInventory(type);
        }, Validators.required, 'STORAGE_EMPTY')
      ]],
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, Validators.required],
      meta: this.getMetaByType(),
      units: null,
      total: 0,
      unit_id: [null, [
        conditionalValidator(() => {
          const type = this.form.get('item_type').value;
          return this.isInventory(type);
        }, Validators.required, 'UNIT_EMPTY')
      ]],
      Taxes: null,
      sku: ''
    });

    this.subscription.add(
      this.form.valueChanges.subscribe(value => {
        const { price, quantity } = value;
        this.form.get('total').setValue((price || 0) * (quantity || 0) , { emitEvent: false });
      })
    );
  }

  private loadItems() {
    let promise: Promise<ItemInventory[]>; 
    if (this.roomId) {
      promise = this.inventoryService.getInventoryByRoom(this.roomId, this.items);
    }
    else {
      promise = this.inventoryService.getInventoryByDefaultRoom(this.items);
    }
    
    promise.then(() => {
      if (this.items) {
        this.items = [...this.items];
      }
      else {
        this.notification.error(null, 'ITEMS_NOT_SET');
      }
    }).catch(err => this.notification.error(null, err.error));
  }

  private loadUnits() {
    this.inventoryService.getItemUnits().then(units => {
      this.units = units;
    }).catch(err => this.notification.error(null, err.error));
  }

}
