import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from 'src/app/_services/notification.service';

import * as moment from 'moment';
import { ExportService } from 'src/app/_services/export.service';
import { ItemUnit, ItemVariation } from 'src/app/models/item';
import { AppService } from 'src/app/app.service';
import { SmartTable, of } from 'smart-table-ng';
import { SortDirection } from 'smart-table-sort';

import _orderBy from 'lodash.orderby';
import { SmartTableService } from 'src/app/_services/smart-table.service';
import { TranslateService } from '@ngx-translate/core';
import {InventoryService} from '../inventory.service';
import Room from 'src/app/models/room';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RoomService} from 'src/app/_services/room.service';

@Component({
  selector: 'app-inventory-report-list',
  templateUrl: './inventory-report-list.component.html',
  styleUrls: ['../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: () => of([])
  }]
})
export class InventoryReportListComponent implements OnInit {

  selectedRoom: Room;
  roomTemp: Room;

  reportForm: FormGroup;
  submitted: boolean;
  isLoading: boolean;

  itemUnits: ItemUnit[] = [];
  rooms: Room[] = [];

  types = ['ASSET', 'GOODS', 'SERVICES'];

  constructor(public _table: SmartTable<ItemVariation>,
              public appService: AppService,
              public smartTableService: SmartTableService,
              public modalService: NgbModal,
              private translateService: TranslateService,
              private formBuilder: FormBuilder,
              private inventoryService: InventoryService,
              private roomService: RoomService,
              private exportService: ExportService,
              private notification: NotificationService
  ) { }

  ngOnInit() {
    this.initForm();
    this.fetchItemUnits();
    this.fetchRooms();
  }

  downloadReport(variations: any[]) {
    if (!variations || !variations.length) {
      this.notification.error(null, 'NO_RECORD');
    }
    else {
      const formValue = this.reportForm.value;
      const filename = [
        'rapport_variation',
        moment(formValue.start).format('DDMMYY')
      ].join('_');

      const data = variations.map(item => {
        const variation: any = item.value;
        return {
          'Document': this.translateService.instant('income.' + variation.type),
          'N°': this.getDocId(variation),
          'Source': variation.InventoryStorage && variation.InventoryStorage.Room ? variation.InventoryStorage.Room.title : '',
          'Destination': variation.Request && variation.Request.Room ? variation.Request.Room.title : '',
          'Désignation': variation.name,
          'Type': this.translateService.instant('item_type.' + variation.item_type),
          'Unité': variation.ItemUnit? variation.ItemUnit.name: '',
          'Entrée': variation.type === 'BILL'? variation.quantity: null,
          'Sortie': variation.type !== 'BILL' ? variation.quantity : null,
          'Créé le': moment(variation.created_at).format('DD MMM YYYY HH:mm')
        }
      });

      this.exportService.exportToExcel(data, filename);
    }
  }

  fetchRooms() {
    this.roomService.list().toPromise().then(rooms => {
      this.rooms = rooms;
    }).catch(err => this.notification.error(null, err.error));
  }

  filterByRoom() {
    this.selectedRoom = this.roomTemp;
    this.modalService.dismissAll();
    console.log(this.selectedRoom);
  }

  getDocLink(variation: any) {
    if (!variation) return null;
    switch (variation.type) {
      case 'BILL':
        return '/inventory/entry/detail';
      case 'INVOICE':
        return '/income/invoice/detail';
      default:
        return '/inventory/out/detail';
    }
  }

  getDocId(variation: any) {
    if (!variation) return null;

    switch (variation.type) {
      case 'BILL':
        return variation.Bill.id;
      case 'INVOICE':
        return variation.Invoice.id;
      default:
        return variation.Request.id;
    }
  }

  getVariations() {
    this.submitted = true;

    if (this.reportForm.valid) {
      const formValue = this.reportForm.value;
      const body = {
        start: moment(formValue.start).format('YYYY-MM-DD')
      };

      this.isLoading = true;

      this.inventoryService.getVariations(body)
        .toPromise()
        .then(res => {
          res = res.map(variation => {
            variation.InventoryStorage = variation.InventoryStorage ? {...variation.InventoryStorage, Room: this.rooms.find(room => room.id === variation.InventoryStorage.room_id)} : null;

            return variation;
          });

          this._table.use(res, {
            filter: {},
            search: {},
            sort: {
              pointer: 'created_at',
              direction: SortDirection.ASC
            },
            slice: {
              page: 1,
              size: 25
            }
          })
        })
        .catch(err => {
          this._table.use([]);
          this.notification.error(null, err.error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    }
    else this.notification.error(null, 'FORM_NOT_VALID');
  }

  openRoomSelectionModal(modal: any) {
    this.roomTemp = null;
    this.modalService.open(modal);
  }

  removeRoomFilter() {
    this.selectedRoom = null;
    this.roomTemp = null;
    this.modalService.dismissAll();
  }

  reset() {
    this.reportForm.reset({
      start: this.appService.getDateStartOf('month').toDate()
    });
    this.submitted = false;
  }

  private fetchItemUnits() {
    this.inventoryService.getItemUnits().then(units => {
      this.itemUnits = units;
    }).catch(err => this.notification.error(null, err.error));
  }

  private initForm() {
    this.reportForm = this.formBuilder.group({
      start: [
        this.appService.getDateStartOf('month').toDate(),
        Validators.required
      ]
    });
  }

}
