import { Component, OnInit } from '@angular/core';

import { FilterOperator } from 'smart-table-filter';

import { HealthService } from '../health.service';
import { NotificationService } from 'src/app/_services/notification.service';

import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

import * as moment from 'moment';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import { Router } from '@angular/router';
import { ExportService } from 'src/app/_services/export.service';
import { AppService } from 'src/app/app.service';
import { TableState } from 'smart-table-ng';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { PrintService } from 'src/app/_services/print.service';
import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';
import _cloneDeep from 'lodash.clonedeep';

interface Record {
  id: number,
  Identity: any,
  date: string,
  RawCodes: HealthDiagnosticCode[],
  Codes: HealthDiagnosticCodeNode[]
}

interface Pager {
  size: number;
  page: number;
  lowerBoundIndex?: number;
  upperBoundIndex?: number;
  length?: number;
}

@Component({
  selector: 'app-health-record',
  templateUrl: './health-record.component.html',
  styleUrls: ['./health-record.component.css']
})
export class HealthRecordComponent implements OnInit {
  customConfig: PerfectScrollbarConfigInterface = {
    suppressScrollX: false,
    suppressScrollY: false
  }

  diagnosticCodesTree: HealthDiagnosticCodeNode[] = [];
  flatDiagnosticCodes: HealthDiagnosticCodeNode[] = [];  
  records: Record[];

  requestTypeId: number;

  submitted: boolean;

  tableState: TableState;
  pager: Pager = { size: 25, page: 1};

  filter: any;

  constructor(public appService: AppService,
              private healthService: HealthService,
              private router: Router,
              private printService: PrintService,
              private exportService: ExportService,
              private requestService: MaintenanceService,
              private notification: NotificationService
  ) {
  }

  ngOnInit() {
    this.setupData();
  }

  exportExcel() {
    const data: any[] = [];
    this.records.forEach(record => {
      const line: any = {};
      line["Matricule N°"] = record.Identity.meta? record.Identity.meta.school_serial: '';
      line["Nom et prénoms"] = record.Identity.name;
      line["École"] = record.Identity.Facility.name + ' - [' + record.Identity.Facility.code + ']';
      line["Classe"] = record.Identity.meta? record.Identity.meta.school_grade: '';
      line["Âge"] = record.Identity.meta? record.Identity.age: '';
      line["Genre"] = record.Identity.sex;

      record.Codes.forEach(code => {
        const key = code.ParentDiagnosticCode ? (code.title + ' [' + code.ParentDiagnosticCode.title + ']'): code.title;
        line[key] = code.value;
      });

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
    this.exportService.exportToExcel(data, 'Registre_Medicale' + suffix);
  }

  generate(event: any) {
    this.submitted = true;
    this.filter = event;

    this.tableState = {
      search: {},
      filter: {
        request_type_id: [
          {
            value: this.requestTypeId,
            operator: FilterOperator.EQUALS,
            type: 'number'
          }
        ],
        requested_at: [
          {
            value: moment(event.start).startOf('day').toISOString(),
            operator: FilterOperator.GREATER_THAN_OR_EQUAL,
            type: 'string'
          },
          {
            value: moment(event.end).endOf('day').toISOString(),
            operator: FilterOperator.LOWER_THAN_OR_EQUAL,
            type: 'string'
          }
        ],
        facility_id: event.Facility ? [
          {
            value: event.Facility.id,
            operator: FilterOperator.EQUALS,
            type: 'number'
          }
        ] : undefined
      },
      slice: this.pager,
      sort: {
        pointer: 'requested_at',
        direction: 'desc'
      }
    };

    this.filterTable();
  }

  getLeafNodes(tree: HealthDiagnosticCodeNode[], result = []) {
    const length = tree.length;

    for (var i = 0; i < length; i++) {
      const node = tree[i];
      let push = false;
      
      node.preferredWidth = this.getPreferredWidthStyle(node);

      if ((!node.Child || node.Child.length === 0) && !HealthService.isQuestion(node)) {
        push = true;
      }
      else {
        if (HealthService.isQuestion(node)) {
          push = true;
        }
        else {
          result = this.getLeafNodes(node.Child, result);
        }
      }
      
      if (push) {
        result.push(node);
      }
    }
    return result;
  }

  getPreferredWidthStyle(node: HealthDiagnosticCodeNode) {
    let descendants = 1;
    if (node.Child && node.Child.length > 0 && !HealthService.isQuestion(node)) {
      descendants = this.countDescendants(node) || 1;
    }

    let width = (125 * descendants) + 'px';

    return { width, maxWidth: width, minWidth: width };
  }

  hasChildren(code: HealthDiagnosticCodeNode) {
    return code.field_type !== 'radio' && code.field_type !== 'checkbox' && code.Child && code.Child.length;
  }

  isPreviousAvailable() {
    return this.pager.page > 1;
  }

  isNextAvailable() {
    const totalPage = Math.round(this.pager.length / this.pager.size);
    return this.pager.page < totalPage;
  }

  nextPage() {
    if (!this.isNextAvailable())
      return;

    this.pager.page++;
    this.filterTable();
  }

  previousPage() {
    if (!this.isPreviousAvailable())
      return;
    
    this.pager.page--;
    this.filterTable();
  }

  print(record: Record) {
    this.healthService.get(record.id).then(document => {
      if (document.RequestType.meta.route.startsWith('/health/consultation')) {
        this.printService.medicalConsultation(document);
      }
      else {
        this.printService.medicalDiagnostic(document, this.diagnosticCodesTree, record.RawCodes);
      }
    }).catch(err => this.notification.error(null, err.error));
   
  }

  onSelectFacility(event: any) {
    if (!event.item) {
      event.preventDefault();
    }
  }

  private countDescendants(code: HealthDiagnosticCodeNode) {
    return this.countChildren(code)
  }

  private countChildren(code: HealthDiagnosticCodeNode) {
    let count = 0
    if (!code.Child || !code.Child.length) return 0;
    if (HealthService.isQuestion(code)) return 1;
    for (let el of [...code.Child]) {
      if (!el.Child || !el.Child.length) {
        count++;
      }
      else {
        count += this.countChildren(el)
      }
    }
    return count;
  }

  private filterTable() {
    this.records = null;

    this.tableState.slice = this.pager;

    this.healthService.paginateWithTrackers(this.tableState, 'TS_HEALTH_DIAGNOSTIC').then((requests: any) => {
      this.records = [];
      requests.data.forEach((request: any) => {
        if (request.Contacts && request.Contacts.length) {
          this.records.push({
            id: request.id,
            Identity: { ...request.Contacts[0], age: moment().diff(request.Contacts[0].bio_dob, 'years'), Facility: request.Facility },
            date: request.requested_at,
            RawCodes: _cloneDeep(request.HealthDiagnosticCodes),
            Codes: HealthService.mapLeafCodesToTrackers(this.flatDiagnosticCodes, request.HealthDiagnosticCodes, (node) => {
              node.preferredWidth = this.getPreferredWidthStyle(node);
            })
          });
        }
      });

      this.pager.page = requests.summary.page;
      this.pager.length = requests.summary.filteredCount;
      this.pager.lowerBoundIndex = (requests.summary.page - 1) * this.pager.size;
      this.pager.upperBoundIndex = Math.min(this.pager.lowerBoundIndex + this.pager.size, this.pager.length);

      setTimeout(() => {
        const result = document.getElementById('result');
        if (result) {
          result.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 200);
    }).catch(err => {
      this.notification.error(null, err.error)
    });
  }

  private loadTree() {
    this.healthService.getHealthTree(this.requestTypeId).then(tree => {
      this.diagnosticCodesTree = tree;
      this.flatDiagnosticCodes = this.getLeafNodes(this.diagnosticCodesTree);
    }).catch(err => this.notification.error(null, err.error));
  }


  private setupData() {
    this.requestService.getTypes({type: 'all'}).toPromise().then(types => {
      const find = types.find(type => type.meta && type.meta.route && this.router.url.startsWith(type.meta.route));
      if (find) {
        this.requestTypeId = find.id;
        this.loadTree();
      }
      else {
        this.notification.error(null, 'TYPE_NOT_FOUND');
      }
    }).catch(err => this.notification.error(null, err.error));

  }
}
