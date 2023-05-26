import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {SmartTableService} from '../../_services/smart-table.service';

import {SmartTable, of, TableState} from 'smart-table-ng';
import server from 'smart-table-server';
import Geography from 'src/app/models/geograhy';

import {AppService} from '../../app.service';
import {MenService} from '../men.service';
import {SettingsService} from 'src/app/settings/settings.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-facility',
  templateUrl: './facility.component.html',
  styleUrls: ['./facility.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: (menService: MenService) => of(
      [],
      menService.getConfig(),
      server({
        query: (tableState) => menService.paginateByUserGeography(tableState)
      })
    ),
    deps: [MenService]
  }]
})
export class FacilityComponent implements OnInit, OnDestroy {
  facilities: Promise<any>;
  communes: Promise<Geography[]>;
  districts: Promise<Geography[]>;
  regions: Promise<Geography[]>;

  selectedCommune: Geography;
  selectedDistrict: Geography;
  selectedRegion: Geography;

  searchCode: string;

  subscription = new Subscription();

  constructor(
    public _table: SmartTable<any>,
    public appService: AppService,
    public smartTableService: SmartTableService,
    private elementRef: ElementRef,
    private settingsService: SettingsService,
    private menService: MenService
  ) {}

  ngOnInit() {
    this.loadGeographies();
    this.initFilters();

    this.subscription = this.settingsService.sidePanelFacilityAdd$.subscribe(value => {
      if (value.isUpdated) {
        this._table.exec();
      }
    })
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  setDataTable(event) {
    this.facilities = event;
  }

  clearFilter() {
    this.selectedCommune = null;
    this.selectedDistrict = null;
    this.selectedRegion = null;
    this.menService.urlParams = null;

    const inputs:any[] = this.elementRef.nativeElement.querySelectorAll('input');

    inputs.forEach(item => item.value = null);
    sessionStorage.removeItem(MenService.TS_KEY);

    this._table.filter({
      code: undefined,
      geography_id: undefined
    });
    this._table.search({
      scope: ['name'],
      value: ''
    });
  }

  filterResult(event: Geography, type: 'region' | 'district' | 'commune') {
    const params = {};
    if (event) {
      params[type] = event.name;
    }

    this.menService.urlParams = params;

    this._table.exec();
  }

  openSidePanelAdd() {
    this.settingsService.updateSidePanelFacilityAdd({isOpen: true});
  }

  removeSpaceFromStr(str: string) {
    if (str) {
      str = str.replace(/\s/g, '');
    }

    return str;
  }

  private initFilters() {
    const ts = JSON.parse(sessionStorage.getItem(MenService.TS_KEY)) as TableState;
    if (ts && ts.filter['code'] && ts.filter['code'].length) {
      this.searchCode = ts.filter['code'][0].value;
    }
  }

  private loadGeographies() {
    this.communes = this.menService.getGeographies('CMN');
    this.districts = this.menService.getGeographies('DST');
    this.regions = this.menService.getGeographies('RGN');
  }
}
