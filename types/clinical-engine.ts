/**
 * Clinical Engine Types
 * ====================
 * Standardized, production-ready types for the Clinical Decision Support System (CDSS).
 * All clinical logic outputs, rule structures, and evaluation results use these types.
 */

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 1: Clinical Alert & Contraindication Types
// ═══════════════════════════════════════════════════════════════════════════════════

export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
export type UrgencyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export interface ClinicalAlert {
  type: string
  severity: AlertSeverity
  message: string
  context?: Record<string, any>
}

export interface Contraindication {
  target: string // medication or condition name
  reason: string
  severity: AlertSeverity
}

export interface TherapeuticWarning {
  warning: string
  context?: string
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 2: Rule Condition Types
// ═══════════════════════════════════════════════════════════════════════════════════

export type ConditionType =
  | 'LAB_RESULT'
  | 'MEDICATION'
  | 'CONDITION'
  | 'VITAL_SIGN'
  | 'SYMPTOM'
  | 'ALLERGY'
  | 'AGE'
  | 'EMERGENCY_FLAG'
  | 'CUSTOM'

export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'includes' | 'not_includes'

export interface RuleCondition {
  type: ConditionType
  field: string
  operator: ComparisonOperator
  value: any
  description?: string
}

export interface RuleGroup {
  logic: 'AND' | 'OR'
  conditions: (RuleCondition | RuleGroup)[]
  description?: string
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 3: Rule Outputs Types
// ═══════════════════════════════════════════════════════════════════════════════════

export interface RiskScoreBreakdown {
  renal?: number
  cardiac?: number
  respiratory?: number
  neurologic?: number
  toxicity?: number
  overdose?: number
  interaction?: number
  [key: string]: number | undefined // Allow custom risk types
}

export interface RuleOutputs {
  risk_scores?: RiskScoreBreakdown
  alerts?: ClinicalAlert[]
  contraindications?: Contraindication[]
  recommendations?: string[]
  therapeutic_warnings?: TherapeuticWarning[]
  urgency?: UrgencyLevel
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 4: Triggered Rule (Auditability)
// ═══════════════════════════════════════════════════════════════════════════════════

export interface TriggeredRule {
  rule_id: string
  rule_name: string
  rule_category?: string
  priority: number
  matched_conditions: {
    condition: RuleCondition | RuleGroup
    matched_value: any
    context_value: any
  }[]
  outputs_applied: RuleOutputs
  triggered_at: Date
  explanation: string
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 5: Clinical Engine Result (Main Output)
// ═══════════════════════════════════════════════════════════════════════════════════

export interface ClinicalEngineResult {
  // Primary clinical assessment
  total_risk_score: number
  urgency_level: UrgencyLevel
  
  // Risk breakdown by category
  risk_scores: RiskScoreBreakdown
  
  // Clinical findings
  alerts: ClinicalAlert[]
  contraindications: Contraindication[]
  recommendations: string[]
  therapeutic_warnings: TherapeuticWarning[]
  
  // Auditability
  triggered_rules: TriggeredRule[]
  
  // Metadata
  evaluation_timestamp: Date
  evaluated_by_engine_version: string
  
  // Additional context
  summary?: string
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 6: Clinical Context (Input to Engine)
// ═══════════════════════════════════════════════════════════════════════════════════

export interface PatientContext {
  id: string
  age: number | null
  name?: string
  gender?: string
  weight?: number
  weight_kg?: number
  height?: number
  allergies?: string[]
  comorbidities?: string[]
  medical_history?: string[]
  immunostatus?: string
  pregnancy_status?: 'not_pregnant' | 'pregnant' | 'breastfeeding'
  smoking_status?: string
  alcohol_use?: string
}

export interface LabResult {
  name: string
  value: number
  unit: string
  timestamp?: Date
  reference_min?: number
  reference_max?: number
  critical_min?: number
  critical_max?: number
  is_critical?: boolean
}

export interface VitalSign {
  heart_rate?: number // bpm
  heartRate?: number
  blood_pressure_systolic?: number // mmHg
  blood_pressure_diastolic?: number // mmHg
  bloodPressure?: {
    systolic?: number
    diastolic?: number
  }
  respiratory_rate?: number // breaths/min
  temperature?: number // °C
  spo2?: number // %
  glucose?: number // mg/dL
}

export interface MedicationContext {
  id: string
  name: string
  category?: string
  dose?: string
  dosage: string
  frequency: string
  duration?: string
  route: string
  generic_name?: string
  contraindications?: Contraindication[]
}

export interface ClinicalContext {
  // Patient info
  patient: PatientContext
  
  // Clinical data
  labs: Record<string, LabResult>
  vitals: VitalSign
  symptoms?: string[]
  emergency_flags?: string[]
  allergies?: string[]
  conditions?: string[]
  
  // Medications & treatments
  medications: MedicationContext[]
  interactions_found?: string[]
  
  // Case info
  case_type?: string
  presenting_complaint?: string
  duration_of_illness?: string
  
  // Metadata
  timestamp: Date
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 7: Clinical Rule Definition (Database model)
// ═══════════════════════════════════════════════════════════════════════════════════

export interface ClinicalRuleDefinition {
  id: string
  name: string
  description?: string
  category: string
  severity: AlertSeverity
  priority: number // 0-100, higher = more important
  enabled: boolean
  trigger_type?: string
  
  // Conditions
  conditions: RuleGroup
  
  // Outputs
  outputs: RuleOutputs
  
  // Metadata
  created_at: Date
  updated_at?: Date
  created_by?: string
  version?: number
  tags?: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 8: Rule Validator Result
// ═══════════════════════════════════════════════════════════════════════════════════

export interface RuleValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface RuleValidationResult {
  is_valid: boolean
  errors: RuleValidationError[]
  warnings: RuleValidationError[]
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 9: Simulation Request/Result
// ═══════════════════════════════════════════════════════════════════════════════════

export interface ClinicalSimulationRequest {
  patient: PatientContext
  labs: Record<string, LabResult>
  vitals: VitalSign
  medications: MedicationContext[]
  symptoms?: string[]
  case_type?: string
}

export interface ClinicalSimulationResult extends ClinicalEngineResult {
  simulation_id?: string
  simulation_timestamp: Date
  simulation_notes?: string
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PART 10: Engine Configuration
// ═══════════════════════════════════════════════════════════════════════════════════

export interface ClinicalEngineConfig {
  version: string
  max_risk_score: number // Usually 100
  rule_evaluation_timeout_ms: number
  enable_rule_tracing: boolean
  enable_performance_metrics: boolean
  default_urgency_thresholds?: {
    low_max: number
    moderate_max: number
    high_max: number
    critical_min: number
  }
}

// Default configuration
export const DEFAULT_ENGINE_CONFIG: ClinicalEngineConfig = {
  version: '1.0.0',
  max_risk_score: 100,
  rule_evaluation_timeout_ms: 5000,
  enable_rule_tracing: true,
  enable_performance_metrics: true,
  default_urgency_thresholds: {
    low_max: 20,
    moderate_max: 50,
    high_max: 80,
    critical_min: 81,
  },
}
