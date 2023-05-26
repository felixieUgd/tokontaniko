import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environment';

import Request from '../models/request';
import HealthDiagnosticCode from 'src/app/models/health-diagnostic-code';
import HealthDiagnosticTracker from '../models/health-diagnostic-tracker';
import HealthDiagnosticCodeNode from 'src/app/models/health-diagnostic-code-node';

import { TableState } from 'smart-table-ng';
import { ServerResult } from '../_services/smart-table.service';
import { isNumeric } from 'rxjs/internal/util/isNumeric';
import {AppService} from '../app.service';

export const ADMINISTRATION_MODES = ['IM', 'orale', 'IV'];



@Injectable({
  providedIn: 'root'
})
export class HealthService {
  static TS_KEY = 'TS_HEALTH';

  $currentStep = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient
  ) { 
  }

  static parseBooleanValue(value: string | boolean): boolean {
    if (value === 'true' || value === true) {
      return true;
    }
    return false;
  }

  static getImcToString(imc: number) {
    if (imc < 18.5) {
      return 'Insuffisance pondérale (maigreur)';
    }
    else if (imc >= 18.5 && imc < 25) {
      return 'Corpulence normale';
    }
    else if (imc >= 25 && imc < 30) {
      return 'Surpoids';
    }
    else if (imc >= 30 && imc < 35) {
      return 'Obésité modérée';
    }
    else if (imc >= 35 && imc < 40) {
      return 'Obésité sévère';
    }
    else if (imc >= 40) {
      return 'Obésité morbide ou massive';
    }
    else {
      return 'Inconnu'
    }
  }

  static generateTrackers(arr: HealthDiagnosticCode[], part?: HealthDiagnosticTracker[]) {
    var trackers = part || [], Child: any;
    arr.forEach((code) => {
      const itemToAdd = {
        health_diagnostic_code_id: code.id,
        value: code.value !== null && code.value !== undefined ? code.value.toString() : null
      };

      if (Array.isArray(code.Child) && code.Child.length) {
        Child = code.Child;
        if (itemToAdd.value !== null) {
          trackers.push(itemToAdd);
        }
        trackers.concat(trackers, this.generateTrackers(Child, trackers));
      } else {
        trackers.push(itemToAdd);
      }
    });
    return trackers;
  }

  static getValue(node: HealthDiagnosticCodeNode, isPrevious?: boolean) {
    let valueStr = '';
    const value = isPrevious? node.previousValue: node.value;
    if (node.value_type === 'number') {
      if (value) {
        valueStr += value.toString();
        if (isNumeric(node.value_max)) {
          valueStr += '/' + node.value_max;
        }
        else if (node.unit) {
          valueStr += node.unit;
        }
      }
      else {
        valueStr = '-';
      }
    }
    else if (node.value_type === 'boolean') {
      if (value != null) {
        valueStr = HealthService.parseBooleanValue(value) ? 'Oui' : 'Non';
      }
      else {
        valueStr = 'Non-défini';
      }
    }
    else {
      valueStr = value;
    }
    return valueStr;
  }

  static isResponse(diagnosticCode: HealthDiagnosticCodeNode) {
    if(!diagnosticCode || !diagnosticCode.ParentDiagnosticCode) {
      return false;
    }

    return HealthService.isQuestion(diagnosticCode.ParentDiagnosticCode);

  }

  static isQuestion(diagnosticCode: HealthDiagnosticCodeNode) {
    if (!diagnosticCode) {
      return false;
    }

    return diagnosticCode.field_type === 'checkbox' || diagnosticCode.field_type === 'radio';
  }

  static isInput(diagnosticCode: HealthDiagnosticCodeNode) {
    if (!diagnosticCode) {
      return false;
    }

    const types = ['plain'];

    return types.indexOf(diagnosticCode.field_type) !== -1;
  }

  static mapLeafCodesToTrackers(codes: HealthDiagnosticCodeNode[], requestCodes: HealthDiagnosticCodeNode[], extraOperation?: (x: HealthDiagnosticCodeNode) => any, result = []) {
    const length = codes.length;

    for (var i = 0; i < length; i++) {
      const node = { ...codes[i] };

      if (extraOperation) {
        extraOperation(node);
      }

      if ((!node.Child || node.Child.length === 0) && !HealthService.isQuestion(node)) {
        let fromRequest: HealthDiagnosticCodeNode;

        for (let i = 0; i < requestCodes.length; i++) {
          if (requestCodes[i].id === node.id) {
            fromRequest = requestCodes[i];
            requestCodes.splice(i, 1);
            break;
          }
        }

        if (fromRequest) {
          fromRequest.value = fromRequest.HealthDiagnosticTracker.value;
          node.value = this.getValue(fromRequest);
        }
      }
      else if (HealthService.isQuestion(node)) {
        node.value = this.getQuestionValue(node, requestCodes);
      }

      result.push(node);
    }

    return result;
  }

  static getQuestionValue(node: HealthDiagnosticCodeNode, requestCodes: HealthDiagnosticCode[]) {
    const choices = requestCodes.filter(x => x.parent_id === node.id);
    if (node.field_type === 'radio') {
      if (choices && choices.length) {
        let response = choices.find(x => x.HealthDiagnosticTracker.value === 'true');

        if (response) {
          return response.title;
        }
      }
    }
    else { //checkbox
      let response = choices.filter(x => x.HealthDiagnosticTracker.value === 'true');
      node.choices = choices;
      if (response && response.length) {
        let val = '';
        response.forEach((code, index) => {
          val += code.title;
          if (index !== response.length - 1) {
            val += ', ';
          }
        });
        return val;
      }
      else {
        return 'Non-défini'
      }
    }
  }

  static mapTreeToTrackers(tree: HealthDiagnosticCodeNode[], requestCodes: HealthDiagnosticCodeNode[], isPrevious?: boolean) {
    const result = [];
    tree.forEach(codeNode => {
      const node = {...codeNode};
      const fromRequest = requestCodes.find(code => code.id === node.id);

      if (fromRequest && fromRequest.HealthDiagnosticTracker) {
        node.value = fromRequest.HealthDiagnosticTracker.value;
      }

      if (isPrevious) {
        if (this.isInput(node) || node.field_type === 'boolean') {
          codeNode.previousValue = this.getValue(node);
        }
        else if (this.isQuestion(node)) {
          codeNode.previousValue = this.getQuestionValue(node, requestCodes);
        }
      }
      
      if (codeNode.Child && codeNode.Child.length) {
        node.Child = this.mapTreeToTrackers(codeNode.Child, requestCodes, isPrevious);
      }
      result.push(node);
    });
    return result;
  }

  createHealthDiagnosticCode(body: any) {
    const url = [AppService.API, 'health', 'code'].join('/');
    return this.http.post<HealthDiagnosticCode>(url, body).toPromise();
  }

  createTrackers(request_id: number, HealthTrackers: HealthDiagnosticTracker[]) {
    const url = [AppService.API, 'health', 'tracker'].join('/');
    return this.http.post<any>(url, { request_id, HealthTrackers }).toPromise();
  }

  get(id: number) {
    const url = [AppService.API, 'health', id].join('/');
    return this.http.get<Request>(url).toPromise();
  }

  getHealthTree(request_type_id: number): Promise<HealthDiagnosticCode[]> {
    const url = [AppService.API, 'health', 'code', 'tree'].join('/');
    return new Promise((resolve, reject) => {
      
      this.http.get<HealthDiagnosticCode[]>(url, { params: { request_type_id: request_type_id.toString(10) } }).toPromise().then(tree => {
        this.transformTree(tree);
        resolve(tree);
      }).catch(err => {
        reject(err);
      });
    })
  }

  listByContact(contact_id: number, filter?: any) {
    const url = [AppService.API, 'health', 'contact', contact_id].join('/');
    return this.http.post<Request[]>(url, { filter }).toPromise();
  }

  listReport(filter: any) {
    const url = [AppService.API, 'health', 'summary'].join('/');
    return this.http.post<HealthDiagnosticCode[]>(url, {filter}).toPromise();
  }

  paginateWithTrackers(tableState: TableState, KEY?: string): Promise<ServerResult> {
    sessionStorage.setItem(KEY || HealthService.TS_KEY, JSON.stringify(tableState));

    const url = [AppService.API, 'health', 'paginate'].join('/');
    return this.http.post<any>(url, tableState).toPromise();
  }

  updateHealthDiagnosticCode(id: number, body: any) {
    const url = [AppService.API, 'health', 'code', id].join('/');
    return this.http.put<HealthDiagnosticCode>(url, body).toPromise();
  }

  updateHealthTree(tree: HealthDiagnosticCode[]) {
    const url = [AppService.API, 'health', 'code', 'tree'].join('/');
    return this.http.post<any>(url, tree).toPromise();
  }
  
  setCurrentStep(newValue: number) {
    this.$currentStep.next(newValue);
  }

  private transformTree(root: HealthDiagnosticCode[], noSort?: boolean, parent?: HealthDiagnosticCode) {
    if (!noSort) {
      root.sort((a, b) => {
        if (a.updated_at < b.updated_at) {
          return -1;
        }
        else if (a.updated_at > b.updated_at) {
          return 1;
        }
        else {
          return 0;
        }
      });
    }

    for (let node of root) {
      if (parent) {
        node.ParentDiagnosticCode = {
          title: parent.title,
          id: parent.id,
          field_type: parent.field_type
        }
      }
      if (node.Child && node.Child.length) {
        this.transformTree(node.Child, noSort, node);
      }
    }
  }
}
