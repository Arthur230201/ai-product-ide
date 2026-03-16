export type PlanErrorSeverity = 'fatal' | 'warn';

export type PlanError = {
  code:
    | 'E_SCHEMA_INVALID'
    | 'E_TEMPLATE_MISSING_REQUIRED_SECTION'
    | 'E_TEMPLATE_ILLEGAL_SECTION'
    | 'E_TEMPLATE_RULE_VIOLATION'
    | 'E_BINDING_MISSING_PRIMARY_DATA'
    | 'E_BINDING_MISSING_SUBMIT_EVENT'
    | 'E_BINDING_INVALID_COMPOSITE_REF'
    | 'E_COMPONENT_UNKNOWN'
    | 'E_COMPONENT_PROPS_INVALID'
    | 'E_USABILITY_MISSING_STATES_SECTION'
    | 'E_USABILITY_MISSING_CTA';
  path: string;
  message: string;
  hint: string;
  severity: PlanErrorSeverity;
};

export function fatal(code: PlanError['code'], path: string, message: string, hint: string): PlanError {
  return { code, path, message, hint, severity: 'fatal' };
}

export function warn(code: PlanError['code'], path: string, message: string, hint: string): PlanError {
  return { code, path, message, hint, severity: 'warn' };
}
