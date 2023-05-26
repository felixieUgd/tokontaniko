import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CategoryService} from 'src/app/accounting/category/category.service';
import {ItemService} from 'src/app/accounting/item/item.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {TaxService} from 'src/app/accounting/tax/tax.service';
import Category from 'src/app/models/category';
import Item from 'src/app/models/item';
import Tax from 'src/app/models/tax';
import {Observable, Subscription} from 'rxjs';
import {AppService} from 'src/app/app.service';
import {SharedService} from 'src/app/_services/shared.service';
import {SessionService} from 'src/app/_services/session.service';

@Component({
  selector: 'app-side-panel-item',
  templateUrl: './side-panel-item.component.html',
  styleUrls: ['./side-panel-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidePanelItemComponent implements OnInit ,OnDestroy {
  categories: Observable<Category[]>;
  form: FormGroup;
  subscription: Subscription;
  taxes: Observable<Tax[]>;

  activeMenu: any;
  itemTypes: string[];
  sidePanelOpen: boolean;
  submitted: boolean;

  constructor(
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private notification: NotificationService,
    private sessionService: SessionService,
    private sharedService: SharedService,
    private taxService: TaxService
  ) { }

  ngOnInit() {
    this.activeMenu = this.sessionService.getActiveMenu();
    this.itemTypes = AppService.ITEM_TYPES;

    this.initForm();

    this.subscription = this.sharedService.sidePanelItem.subscribe((value:any) => {
      this.reset();
      this.sidePanelOpen = value;

      if (value) {
        this.taxes = this.taxService.list();
        this.categories = this.categoryService.list({type: 'item'});
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  close() {
    this.sharedService.sidePanelItem.next(false);
  }

  onSelectCategory(event): void {
    event.preventDefault();

    this.form.patchValue({
      category_id: event.item.id,
      category_name: event.item.name
    });
  }

  reset() {
    this.submitted = false;

    this.form.reset({
      quantity: 0,
      initial_quantity: null,
      enabled: true
    });
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const value = this.form.getRawValue();
      const item = new Item(Object.assign({}, value, {
        category_id: value.category.id,
        category_name: value.category.name,
        type: this.form.get('type').value,
      }));

      this.itemService.create(item)
        .toPromise()
        .then(() => {
          this.close();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.submitted = false;

    this.form = this.formBuilder.group({
      name: [null, Validators.required],
      sku: [null, Validators.required],
      description: null,
      index: null,
      itinerary_id: null,
      sale_price: [null, Validators.required],
      purchase_price: [null, Validators.required],
      quantity: 0,
      initial_quantity: null,
      type: [null, Validators.required],
      tax_id: null,
      Taxes: null,
      category: [null, Validators.required],
      enabled: true
    });
  }


}
