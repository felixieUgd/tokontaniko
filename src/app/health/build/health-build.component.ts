import { Component, OnInit } from '@angular/core';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import { NotificationService } from 'src/app/_services/notification.service';
@Component({
  selector: 'app-health-build',
  templateUrl: './health-build.component.html',
  styleUrls: ['./health-build.component.css']
})
export class HealthBuildComponent implements OnInit {

  requestTypes: any[];

  constructor(
    private requestService: MaintenanceService,
    private settingsCompanyService: SettingsCompanyService,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.loadRequestTypes();
  }

  private loadRequestTypes() {
    const defaultCategoryId = this.settingsCompanyService.getCompanyDefaultSettings('default_health_category');
    if (defaultCategoryId) {
      this.requestService.getTypes({type: 'all'}, defaultCategoryId).toPromise().then(types => {
        this.requestTypes = types;
      }).catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }
  }

}
