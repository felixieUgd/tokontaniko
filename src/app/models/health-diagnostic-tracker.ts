import BaseModel from "./base-model";

export default class HealthDiagnosticTracker extends BaseModel {
    id?: number;
    value?: any;
    health_diagnostic_code_id?: number;
}