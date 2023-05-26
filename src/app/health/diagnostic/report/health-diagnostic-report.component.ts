import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';

import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { AppService } from 'src/app/app.service';
import { HealthService } from '../../health.service';
import { MenService } from 'src/app/men/men.service';
import { SessionService } from 'src/app/_services/session.service';
import { SmartTableService } from 'src/app/_services/smart-table.service';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { SettingsCompanyService } from 'src/app/settings/company/settings-company.service';

import Facility from 'src/app/models/facility';
import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';

import server from 'smart-table-server';
import { of, SmartTable } from 'smart-table-ng';
import { FilterOperator, TableState } from 'smart-table-core';

import * as moment from 'moment';

@Component({
  selector: 'app-health-diagnostic-report',
  templateUrl: './health-diagnostic-report.component.html',
  styleUrls: ['./health-diagnostic-report.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: (maintenanceService: MaintenanceService) => of(
      [],
      {
        search: {},
        filter: {
          facility_id: [
            {
              value: 0,
              operator: 'equals',
              type: 'number'
            }
          ]
        },
        sort: { pointer: 'created_at', direction: 'desc' },
        slice: { page: 1, size: 25 }
      },
      server({
        query: (tableState: TableState) => maintenanceService.paginate(tableState, 'TS_HEALTH_DIAGNOSTIC')
      })
    ),
    deps: [MaintenanceService]
  }]
})
export class HealthDiagnosticReportComponent implements OnInit {
  searchForm: FormGroup;

  healthDiagnosticCodes: HealthDiagnosticCode[] = [];

  submitted = false;
  showResult = false;

  operators = [
    {
      symbol: "Égal à",
      code: "equals"
    },
    {
      symbol: "Supérieur à",
      code: "gt"
    },
    {
      symbol: "Inférieur à",
      code: "lt"
    }
  ]

  MedicalService = HealthService;

  formatter = (item: Facility) => {
    return item.name;
  } 

  searchFacility = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => term.length <= 3 ? [] :
        this.menService.select(term)
          .toPromise()
          .then(res => {
            return res.length > 0 ? res : [null];
          })
          .catch(err => {
            this.notification.error(null, err.error);
          }))
    );

  constructor(public _table: SmartTable<any>,
              public smartTableService: SmartTableService,
              public appService: AppService,
              private fb: FormBuilder,
              private healthService: HealthService,
              private notification: NotificationService,
              private sessionService: SessionService,
              private settingsCompanyService: SettingsCompanyService,
              private menService: MenService
  ) { }

  get Filters() {
    return this.searchForm.get('Filters') as FormArray;
  }

  ngOnInit() {
    this.initForm();

    this.healthService.getHealthTree(2).then(tree => {
      this.healthDiagnosticCodes = tree;
    }).catch(err => this.notification.error(null, err));
  }

  formatDiagnosticCodeLabel(diagnosticCode: HealthDiagnosticCode) {
    return diagnosticCode.code + ' - ' + diagnosticCode.title;
  }

  addDiagnosticCode(filter: any, selected?:HealthDiagnosticCode){
    this.submitted = false;
    const itemToAdd = this.fb.group({
      diagnosticCode: [selected || null, Validators.required],
      groupIndex: null
    });

    const diagnosticCodes = filter.get('DiagnosticCodes');

    itemToAdd.get("groupIndex").patchValue(diagnosticCodes.length);
    itemToAdd.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(data => this.onDiagnosticCodeValueChanged(data, filter));

    diagnosticCodes.push(itemToAdd);
  }

  addFilter() {
    const filter = this.fb.group({
      operator: 'equals',
      value: [0, Validators.required],
      DiagnosticCodes: this.fb.array([])
    });

    this.Filters.push(filter);
    this.addDiagnosticCode(filter);
    
    return filter;
  }

  getDiagnosticCodes(filterField: AbstractControl) {
    return filterField.get('DiagnosticCodes') as FormArray;
  }

  onDiagnosticCodeValueChanged(data: any, currentFilter: any): void {
    const groupIndex = data["groupIndex"];
    const selected = data["diagnosticCode"];
    const diagnosticCodes = currentFilter.get('DiagnosticCodes');
    const tempLength = diagnosticCodes.length;
    for(let i = groupIndex + 1; i < tempLength; i++){
      diagnosticCodes.removeAt(groupIndex + 1);
    }

    currentFilter.get('operator').setValue('equals');
    
    currentFilter.get('value').setValue(0);

    if (selected) {
      if ((selected.field_type === 'category' && !HealthService.isResponse(selected)) || HealthService.isQuestion(selected)) {
        this.addDiagnosticCode(currentFilter);
      }
      else if (selected.field_type === 'boolean') {
        currentFilter.get('value').setValue('true');
      }
    }
  }

  onSelectFacility(event: any) {
    if (!event.item) {
      event.preventDefault();
    }
  }

  search() {
    this.submitted = true;
    if (this.searchForm.valid) {
      const formValue = this.searchForm.getRawValue();
      const data: any = {
        facility_id: formValue.Facility.id,
        start: moment(formValue.start).startOf("day").toISOString(),
        end: moment(formValue.end).endOf("day").toISOString()
      };
      const filters = formValue.Filters as any[];
      data.filters = [];

      if (filters) {
        filters.forEach(filter => {
          const diagnosticCode = filter.DiagnosticCodes[filter.DiagnosticCodes.length - 1].diagnosticCode;
          const filterToAdd: any = {};
          filterToAdd.health_diagnostic_code_id = diagnosticCode.id;

          if (HealthService.isInput(diagnosticCode)) {
            filterToAdd.value = filter.value.toString();
            filterToAdd.operator = filter.operator;
          }
          else if (diagnosticCode.field_type === 'boolean') {
            filterToAdd.value = filter.value.toString();
            filterToAdd.operator = 'equals';
          }
          else { //response
            filterToAdd.value = 'true';
            filterToAdd.operator = 'equals';
          }

          data.filters.push(filterToAdd);
        });
      }

      this.settingsCompanyService
        .get(this.sessionService.getCompanyId())
          .toPromise()
          .then(company => {
            const id = +company.Settings['general.default_health_diagnostic_category'];
            if (!isNaN(id)) {
              const tableFilter = {
                facility_id: [
                  {
                    value: data.facility_id,
                    operator: FilterOperator.EQUALS,
                    type: 'number'
                  }
                ],
                category_id: [
                  {
                    value: id,
                    operator: FilterOperator.EQUALS,
                    type: 'number'
                  }
                ],
                created_at: undefined
              };
              
              if (data.start || data.end) {
                tableFilter.created_at = [];
                if (data.start) {
                  tableFilter.created_at.push({
                    value: data.start,
                    operator: FilterOperator.GREATER_THAN_OR_EQUAL,
                    type: "string"
                  });
                }

                if (data.end) {
                  tableFilter.created_at.push({
                    value: data.end,
                    operator: FilterOperator.LOWER_THAN_OR_EQUAL,
                    type: "string"
                  });
                }
              }

              this._table.filter(tableFilter);

              this.showResult = true;
            }
            else {
              this.notification.error(null, 'CATEGORY_NOT_FOUND');
            }
          })
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.searchForm = this.fb.group({
      Facility: [null, Validators.required],
      start: moment().startOf('year').startOf('month').startOf('day').toDate(),
      end: moment().endOf('year').endOf('month').endOf('day').toDate(),
      Filters: this.fb.array([])
    });
  }

  private flattenNestedObjectsArray(arr: any[], keepReference?: boolean, part?: any[]){
    let flattened = part || [], Child: any;
    arr.forEach((v) => {
      if (!keepReference) {
        v = {...v};
      }
      if (Array.isArray(v.Child) && v.Child.length) {
        Child = v.Child;
        if (v.value_types !== 'string') {
          flattened.push(v);
        }
        flattened.concat(flattened, this.flattenNestedObjectsArray(Child, keepReference, flattened));                
      } else {
        if (v.value_types !== 'string') {
          flattened.push(v);
        }
      }        
    });
    return flattened;
  }

}
