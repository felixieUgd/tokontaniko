import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {SmartTable, from} from 'smart-table-ng';

import {AppService} from 'src/app/app.service';
import {NotificationService} from '../../_services/notification.service';
import {SessionService} from '../../_services/session.service';
import {SettingsCompanyService} from './settings-company.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';

const providers = [{
  provide: SmartTable,
  useFactory: (companyService: SettingsCompanyService) => from(companyService.list(true), {
    search: {},
    slice: {page: 1, size: 25},
    filter: {},
    sort: {
      pointer: 'id',
      direction: 'asc'
    }
  }),
  deps: [SettingsCompanyService]
}];

@Component({
  selector: 'app-company-list',
  templateUrl: './settings-company.component.html',
  styles: ['.table > td {vertical-align: middle}'],
  providers
})
export class SettingsCompanyComponent implements OnInit {
  currentCompanyId;

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              private router: Router,
              private settingsCompanyService: SettingsCompanyService,
              private session: SessionService,
              private notification: NotificationService,
              public smartTableService: SmartTableService) {
  }

  ngOnInit() {
    this.currentCompanyId = this.session.getCompanyId();
  }

  edit(id) {
    if (id === this.session.getCompanyId()) {
      this.router.navigate(['/settings/company/edit', id]);
    }
    else {
      this.notification.error(null, 'SWITCH_BEFORE_EDIT');
    }
  }

  mapData(data: any[]) {
    if (data && data.length > 0) {
      if (data[0].value.hasOwnProperty('general.company_name')) {
        return data.map(item => {
          item.value.company_name = item.value['general.company_name'];
          item.value.company_email = item.value['general.company_email'];

          delete item.value['general.company_name'];
          delete item.value['general.company_email'];

          return item;
        });
      }
    }

    return data;
  }

  switch(company_id) {
    this.settingsCompanyService.switch(company_id)
      .toPromise()
      .then(res => {
        sessionStorage.setItem('session', JSON.stringify(res));

        this.router.navigateByUrl('/', {skipLocationChange: true})
          .then(() => this.router.navigate(['/pulse']));
        this.notification.success(null, 'COMPANY_SWITCHED');
      })
      .catch(err => this.notification.error(null, err.error));
  }

}
