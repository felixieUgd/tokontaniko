import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Subscription} from 'rxjs';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import {SettingsCompanyService} from 'src/app/settings/company/settings-company.service';
import { NotificationService } from 'src/app/_services/notification.service';

@Component({
  selector: 'app-health-add',
  templateUrl: './health-add.component.html',
  styleUrls: ['./health-add.component.css']
})
export class HealthAddComponent implements OnInit, OnDestroy {
  id: any;
  requestTypes: any[];

  selectedType: any;
  subscription = new Subscription();

  constructor(private requestService: MaintenanceService,
              private notification: NotificationService,
              private settingsCompanyService: SettingsCompanyService,
              private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadParam();
    this.loadRequestTypes();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadRequestTypes() {
    const defaultCategoryId = this.settingsCompanyService.getCompanyDefaultSettings('default_health_category');
    if (defaultCategoryId) {
      this.requestService.getTypes({type: 'all'}, +defaultCategoryId).toPromise().then(types => {
        this.requestTypes = types.filter(type => type.meta && type.meta.route);
        this.selectedType = this.requestTypes.length ? this.requestTypes[0] : null;
      }).catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'CATEGORY_NOT_FOUND');
    }
  }

  private loadParam() {
    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        if (params) {
          this.id = params['id'];
        }
      })
    );
  }

}
