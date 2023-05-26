import BaseModel from "./base-model";
import HealthDiagnosticTracker from "./health-diagnostic-tracker";
import Request from "./request";

export default class HealthDiagnosticCode implements BaseModel {
    id?: number;
    code?: string;
    title?: string;
    description?: string;
    field_type?: 'category' | 'checkbox' | 'radio' | 'boolean' | 'plain';
    parent_id?: number;
    
    is_required?: boolean;
    value_type?: 'number' | 'string' | 'boolean';
    unit?: string;
    value_min?: number;
    value_max?: number;
    request_type_id?: number;

    /* tracker value */
    value?: any;

    created_at?: string;
    updated_at?: string;

    Child?: HealthDiagnosticCode[];
    ParentDiagnosticCode?: HealthDiagnosticCode;
    Requests?: Request[];
    HealthDiagnosticTracker?: HealthDiagnosticTracker;
}