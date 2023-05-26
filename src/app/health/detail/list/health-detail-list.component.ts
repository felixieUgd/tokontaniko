import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Subscription} from 'rxjs';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import Request from 'src/app/models/request';
import { NotificationService } from 'src/app/_services/notification.service';
import { UtilityService } from 'src/app/_services/utility.service';
import { HealthService } from '../../health.service';

@Component({
  selector: 'app-health-detail-list',
  templateUrl: './health-detail-list.component.html',
  styleUrls: ['./health-detail-list.component.css']
})
export class HealthDetailListComponent implements OnInit, OnDestroy {
  id: number;
  requests: Request[];
  isLoading: boolean;

  subscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private notification: NotificationService,
    public maintenanceService: MaintenanceService,
    private utilityService: UtilityService,
    private healthService: HealthService
  ) { }

  ngOnInit() {
    this.subscription = this.route.parent.paramMap.subscribe(
      (params) => {
        const idParam = params.get('id');
        if (idParam && !isNaN(+idParam)) {
          this.id = +idParam;
          this.isLoading = true;
          this.healthService.listByContact(this.id).then(requests => {
            this.requests = requests;
          }).catch(err => this.notification.error(null, err.error))
            .finally(() => {
              this.isLoading = false;
            });
        }
        else {
          this.notification.error(null, 'PERSON_NOT_FOUND');
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  getBgColor(status: string) {
    return this.utilityService.statusStyle(status).background;
  }

}
