/**
 * Typed TemplateRules for validatePlan — templateId union + bindingRequirements.
 * JSON 落盘仍可为 Record；读入后 cast 为 Partial<TemplateRulesTyped> 做校验。
 */
export type TemplateIdUnion =
  | 'list'
  | 'detail'
  | 'form'
  | 'dashboard'
  | 'list_detail_split'
  | 'search_results'
  | 'wizard'
  | 'review_approve'
  | 'settings';

export type BindingRequirementsView = {
  minPrimaryDataQueries?: number;
  maxPrimaryDataQueries?: number;
  requireResultsDataBinding?: boolean;
  requireAtLeastOneDataBindingInContent?: boolean;
  requireSelectionToDetailNav?: boolean;
  requireSearchInput?: boolean;
  requireFiltering?: boolean;
};

export type BindingRequirementsAction = {
  minSubmitEvents?: number;
  allowStepProgression?: boolean;
  preferTwoActionsApproveReject?: boolean;
  allowSaveDraft?: boolean;
};

export type TemplateRulesTyped = {
  templateId: TemplateIdUnion;
  defaultDensity: 'compact' | 'comfortable' | 'airy';
  allowedSections: string[];
  requiredSections: string[];
  maxComponentsPerSection?: Record<string, number>;
  ctaRules?: Record<string, unknown>;
  stateRules?: {
    requireLoading?: boolean;
    requireEmpty?: boolean;
    requireError?: boolean;
  };
  bindingRequirements?: {
    view?: BindingRequirementsView;
    action?: BindingRequirementsAction;
  };
  layoutRules?: Record<string, unknown>;
};
