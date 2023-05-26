import HealthDiagnosticCode from "./health-diagnostic-code";

export default class HealthDiagnosticCodeNode extends HealthDiagnosticCode {
    toggle?: boolean;
    hasError?: boolean;
    isLast?: boolean;

    preferredWidth?: any;
    previousValue?: any;
    choices?: HealthDiagnosticCodeNode[];
}