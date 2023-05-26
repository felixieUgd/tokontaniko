import { Component, OnInit } from '@angular/core';
import {of, SmartTable} from 'smart-table-ng';
import {MenService} from 'src/app/men/men.service';

import server from 'smart-table-server';
import Facility from 'src/app/models/facility';
import {SettingsService} from '../../settings.service';

const KEY = 'TS_FACILITY';

@Component({
  selector: 'app-settings-structure-facility',
  templateUrl: './settings-structure-facility.component.html',
  styleUrls: ['./settings-structure-facility.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: (menService: MenService) => of(
      [],
      menService.getConfig(KEY),
      server({
        query: (tableState) => menService.paginate(tableState, KEY)
      })
    ),
    deps: [MenService]
  }]
})
export class SettingsStructureFacilityComponent implements OnInit {

  subscriptions = [];

  constructor(
    private _table: SmartTable<any>,
    private settingsService: SettingsService) {
  }

  ngOnInit() {
    this.subscriptions.push(
      this.settingsService.sidePanelFacilityAdd$.subscribe(value => {
        if (value.isUpdated) {
          this._table.exec();
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.subscriptions.length) {
      for (const elem of this.subscriptions) {
        elem.unsubscribe();
      }
    }
  }

  openSidePanelAdd(facility?: Facility) {
    this.settingsService.updateSidePanelFacilityAdd({isOpen: true, facility});
  }

}
