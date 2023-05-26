import { Component, OnInit } from '@angular/core';

import { HealthService } from '../health.service';
import { NotificationService } from 'src/app/_services/notification.service';

import Request from 'src/app/models/request';
import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';
import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import { Router } from '@angular/router';
import { FilterOperator } from 'smart-table-filter';
 
import * as moment from 'moment';
import { ExportService } from 'src/app/_services/export.service';

@Component({
  selector: 'app-health-report',
  templateUrl: './health-report.component.html',
  styleUrls: ['./health-report.component.css']
})
export class HealthReportComponent implements OnInit {

  diagnosticCodes: any[];
  flatDiagnosticCodes: HealthDiagnosticCode[] = [];

  submitted: boolean;
  isLoading: boolean;

  requestTypeId: number;

  filter: any;

  constructor(private notification: NotificationService,
              private healthService: HealthService,
              private exportService: ExportService,
              private requestService: MaintenanceService,
              private router: Router
  ) {
  }

  ngOnInit() {
    this.setupData();
  }

  exportExcel() {
    const data: any[] = [];
    this.diagnosticCodes.forEach(code => {
      const line: any = {};
      line['Diagnostic'] = this.formatCode(code);
      line['M'] = code.groupedBySex['M'] || 0;
      line['F'] = code.groupedBySex['F'] || 0;
      line['Inférieur à 6 ans'] = code.groupedByAge['toddler'] || 0;
      line['6 à 14 ans'] = code.groupedByAge['child'] || 0;
      line['15 à 25 ans'] = code.groupedByAge['teen'] || 0;
      line['Supérieur à 25 ans'] = code.groupedByAge['adult'] || 0;
      line['Total'] = code.total || 0;

      data.push(line);
    });
    
    let suffix = '';
    if (this.filter) {
      suffix += '_';
      if (this.filter.Facility) {
        suffix += this.filter.Facility.name.replace(' ', '_') + '_';
      }
      suffix += moment(this.filter.start).format('YYYYMMDD') + '_' + moment(this.filter.end).format('YYYYMMDD');
    }
    this.exportService.exportToExcel(data, 'Rapport_Medicale' + suffix);
  }

  formatCode(code: HealthDiagnosticCode) {
    if (code.ParentDiagnosticCode) {
      return '[' + code.ParentDiagnosticCode.title + '] ' + code.title;
    }

    return code.title;
  }

  generate(formValue: any) {
    this.submitted = true;
    this.isLoading = true;

    this.filter = formValue;
    
    const filter = {
      request_type_id: [
        {
          value: this.requestTypeId,
          operator: FilterOperator.EQUALS,
          type: 'number'
        }
      ],
      requested_at: [
        {
          value: moment(formValue.start).startOf('day').toISOString(),
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          type: 'string'
        },
        {
          value: moment(formValue.end).endOf('day').toISOString(),
          operator: FilterOperator.LOWER_THAN_OR_EQUAL,
          type: 'string'
        }
      ],
      facility_id: formValue.Facility ? [
        {
          value: formValue.Facility.id,
          operator: FilterOperator.EQUALS,
          type: 'number'
        }
      ] : undefined
    };


    this.healthService.listReport(filter).then(data => {
      data.sort((a, b) => {
        return (a.parent_id || 0) - (b.parent_id || 0);
      });
      this.diagnosticCodes = data.reduce((result, code) => {
        if (!code.title.toLowerCase().startsWith('aucun')) {
          const requests = (code.Requests as Array<Request>);
          const groupedBySex = requests.reduce((group, req) => (group[req.Contacts[0].sex] = (group[req.Contacts[0].sex] || 0) + 1, group), {});

          const groupedByAge = requests
            .reduce((group, req) => {
              let index: string;
              const age = moment().diff(req.Contacts[0].bio_dob, 'years');
              if (age < 6) {
                index = 'toddler';
              }
              else if (age >= 6 && age < 15) {
                index = 'child';
              }
              else if (age >= 15 && age <= 25) {
                index = 'teen';
              }
              else {
                index = 'adult';
              }

              group[index] = (group[index] || 0) + 1;
              return group;
            }, {});

          const parent = this.flatDiagnosticCodes.find(x => x.id === code.parent_id);

          result.push({
            title: code.title,
            ParentDiagnosticCode: parent ? { title: parent.title } : undefined,
            groupedBySex,
            groupedByAge,
            total: (groupedBySex['M'] || 0) + (groupedBySex['F'] || 0)
          });
        }

        return result;
      }, []);
    })
    .catch(err => {
      this.notification.error(null, err.error);
    })
    .finally(() => this.isLoading = false);
    
  }

  private flattenNestedObjectsArray(arr: any[], keepReference?: boolean, part?: any[]) {
    var flattened = part || [], Child: any;
    arr.forEach((v) => {
      if (!keepReference) {
        v = { ...v };
      }

      if (Array.isArray(v.Child) && v.Child.length) {
        Child = v.Child;
        flattened.push(v);
        flattened.concat(flattened, this.flattenNestedObjectsArray(Child, keepReference, flattened));
      } else {
        flattened.push(v);
      }
    });
    return flattened;
  }

  private setupData() {
    this.requestService.getTypes({type: 'all'}).toPromise().then(types => {
      const find = types.find(type => type.meta && type.meta.route && this.router.url.startsWith(type.meta.route));
      if (find) {
        this.requestTypeId = find.id;

        this.healthService.getHealthTree(this.requestTypeId).then(tree => {
          this.flatDiagnosticCodes = this.flattenNestedObjectsArray(tree);
        }).catch(err => this.notification.error(null, err.error))
          .finally(() => {
            this.isLoading = false;
          });
      }
      else {
        this.notification.error(null, 'TYPE_NOT_FOUND');
      }
    }).catch(err => this.notification.error(null, err.error));

  }

}
