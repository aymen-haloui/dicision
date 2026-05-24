/**
 * Seed Rules
 * ==========
 * Realistic clinical rules demonstrating scoring, alerts, urgency escalation,
 * and contraindications for demonstration and testing.
 */

import { ClinicalRuleDefinition, RuleGroup, RuleOutputs } from '@/types/clinical-engine'

export const seedRules: Omit<ClinicalRuleDefinition, 'id' | 'created_at'>[] = [
  {
    name: 'Metformin + CKD Stage 4-5',
    description: 'Severe renal impairment (eGFR < 30) with Metformin increases lactic acidosis risk',
    category: 'RENAL',
    severity: 'CRITICAL',
    priority: 95,
    enabled: true,
    trigger_type: 'LAB_RESULT + MEDICATION',
    version: 1,
    tags: ['metformin', 'renal', 'toxicity'],
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'MEDICATION',
          field: 'medications.name',
          operator: 'includes',
          value: 'Metformin',
        },
        {
          type: 'LAB_RESULT',
          field: 'labs.eGFR.value',
          operator: '<',
          value: 30,
        },
      ],
    } as RuleGroup,
    outputs: {
      risk_scores: {
        renal: 35,
        toxicity: 25,
      },
      alerts: [
        {
          type: 'contraindication',
          severity: 'CRITICAL',
          message: 'ABSOLUTE CONTRAINDICATION: Metformin with eGFR < 30 (lactic acidosis risk)',
        },
      ],
      contraindications: [
        {
          target: 'Metformin',
          reason: 'Severe renal impairment (eGFR < 30)',
          severity: 'CRITICAL',
        },
      ],
      recommendations: [
        'STOP Metformin immediately',
        'Monitor serum creatinine and eGFR',
        'Check lactate level',
        'Consider alternative antidiabetic (GLP-1, SGLT2i)',
      ],
      therapeutic_warnings: [
        { warning: 'Risk of lactic acidosis', context: 'Metformin accumulation' },
      ],
      urgency: 'CRITICAL',
    } as RuleOutputs,
    updated_at: new Date(),
    created_by: 'system_seed',
  },

  {
    name: 'Warfarin + NSAID Interaction',
    description: 'NSAIDs inhibit platelet aggregation and displace warfarin from protein binding',
    category: 'INTERACTION',
    severity: 'HIGH',
    priority: 90,
    enabled: true,
    trigger_type: 'MEDICATION_INTERACTION',
    version: 1,
    tags: ['warfarin', 'nsaid', 'interaction', 'bleeding'],
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'MEDICATION',
          field: 'medications.name',
          operator: 'includes',
          value: 'Warfarin',
        },
        {
          type: 'MEDICATION',
          field: 'medications.category',
          operator: 'includes',
          value: 'NSAID',
        },
      ],
    } as RuleGroup,
    outputs: {
      risk_scores: {
        interaction: 30,
      },
      alerts: [
        {
          type: 'drug_interaction',
          severity: 'HIGH',
          message: 'NSAID + Warfarin: Increased bleeding risk',
        },
      ],
      recommendations: [
        'AVOID combining Warfarin with NSAIDs',
        'If necessary, use acetaminophen or COX-2 inhibitor (celecoxib)',
        'Monitor INR closely',
        'Consider gastroprotection (PPI)',
      ],
      therapeutic_warnings: [
        { warning: 'Increased GI bleeding risk', context: 'NSAID + Warfarin interaction' },
        { warning: 'Elevated INR risk', context: 'Warfarin displacement' },
      ],
      urgency: 'HIGH',
    } as RuleOutputs,
    updated_at: new Date(),
    created_by: 'system_seed',
  },

  {
    name: 'Severe Hyperkalemia (K > 6.5)',
    description: 'Potassium > 6.5 mEq/L with cardiac symptoms requires urgent intervention',
    category: 'EMERGENCY',
    severity: 'CRITICAL',
    priority: 100,
    enabled: true,
    trigger_type: 'LAB_RESULT',
    version: 1,
    tags: ['hyperkalemia', 'cardiac', 'emergency'],
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'LAB_RESULT',
          field: 'labs.potassium.value',
          operator: '>',
          value: 6.5,
        },
      ],
    } as RuleGroup,
    outputs: {
      risk_scores: {
        cardiac: 50,
      },
      alerts: [
        {
          type: 'emergency',
          severity: 'CRITICAL',
          message: 'SEVERE HYPERKALEMIA: Potassium > 6.5 mEq/L - Cardiac arrhythmia risk',
        },
      ],
      recommendations: [
        'EMERGENCY: Administer 10 mL calcium gluconate IV stat',
        'Give 10 U regular insulin + 25g dextrose IV',
        'Consider nebulized albuterol',
        'Start sodium polystyrene sulfonate (Kayexalate)',
        'Prepare for hemodialysis if persistent',
        'Check ECG immediately',
      ],
      therapeutic_warnings: [
        { warning: 'Cardiac arrhythmias possible', context: 'Severe hyperkalemia' },
        { warning: 'QT prolongation risk', context: 'K > 6.5' },
      ],
      urgency: 'CRITICAL',
    } as RuleOutputs,
    updated_at: new Date(),
    created_by: 'system_seed',
  },

  {
    name: 'Respiratory Failure (SpO2 < 85%)',
    description: 'Severe hypoxemia requiring immediate respiratory support',
    category: 'EMERGENCY',
    severity: 'CRITICAL',
    priority: 99,
    enabled: true,
    trigger_type: 'VITAL_SIGN',
    version: 1,
    tags: ['hypoxemia', 'respiratory', 'emergency'],
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'VITAL_SIGN',
          field: 'vitals.spo2',
          operator: '<',
          value: 85,
        },
      ],
    } as RuleGroup,
    outputs: {
      risk_scores: {
        respiratory: 45,
      },
      alerts: [
        {
          type: 'emergency',
          severity: 'CRITICAL',
          message: 'RESPIRATORY FAILURE: SpO2 < 85% - Severe hypoxemia',
        },
      ],
      recommendations: [
        'Initiate high-flow oxygen (10 L/min)',
        'Prepare for intubation if SpO2 remains < 90% after supplementation',
        'Check blood gas (ABG) immediately',
        'Assess for pulmonary edema',
        'Consider CPAP/BiPAP',
      ],
      therapeutic_warnings: [
        { warning: 'Cerebral hypoxia risk', context: 'SpO2 < 85%' },
      ],
      urgency: 'CRITICAL',
    } as RuleOutputs,
    updated_at: new Date(),
    created_by: 'system_seed',
  },

  {
    name: 'ACE Inhibitor + Potassium Sparing Diuretic',
    description: 'Combined use increases hyperkalemia risk',
    category: 'INTERACTION',
    severity: 'MODERATE',
    priority: 70,
    enabled: true,
    trigger_type: 'MEDICATION_INTERACTION',
    version: 1,
    tags: ['acei', 'diuretic', 'interaction'],
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'MEDICATION',
          field: 'medications.category',
          operator: 'includes',
          value: 'ACE_INHIBITOR',
        },
        {
          type: 'MEDICATION',
          field: 'medications.category',
          operator: 'includes',
          value: 'POTASSIUM_SPARING_DIURETIC',
        },
      ],
    } as RuleGroup,
    outputs: {
      risk_scores: {
        renal: 15,
        interaction: 20,
      },
      alerts: [
        {
          type: 'drug_interaction',
          severity: 'MODERATE',
          message: 'ACE inhibitor + K-sparing diuretic increases hyperkalemia risk',
        },
      ],
      recommendations: [
        'Monitor serum potassium weekly for 4 weeks, then monthly',
        'Check renal function (eGFR, creatinine)',
        'Consider alternative: loop diuretic or thiazide',
      ],
      therapeutic_warnings: [
        { warning: 'Hyperkalemia risk', context: 'ACE + K-sparing diuretic' },
      ],
      urgency: 'MODERATE',
    } as RuleOutputs,
    updated_at: new Date(),
    created_by: 'system_seed',
  },

  {
    name: 'Gentamicin Dosing in CKD',
    description: 'Aminoglycosides require renal dose adjustment',
    category: 'RENAL',
    severity: 'HIGH',
    priority: 85,
    enabled: true,
    trigger_type: 'MEDICATION + LAB_RESULT',
    version: 1,
    tags: ['gentamicin', 'aminoglycoside', 'renal', 'dosing'],
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'MEDICATION',
          field: 'medications.name',
          operator: 'includes',
          value: 'Gentamicin',
        },
        {
          type: 'LAB_RESULT',
          field: 'labs.eGFR.value',
          operator: '<',
          value: 60,
        },
      ],
    } as RuleGroup,
    outputs: {
      risk_scores: {
        renal: 20,
        toxicity: 15,
      },
      alerts: [
        {
          type: 'dosing_alert',
          severity: 'HIGH',
          message: 'Gentamicin requires renal dose adjustment for eGFR < 60',
        },
      ],
      recommendations: [
        'Adjust gentamicin dosing based on eGFR',
        'Extend dosing interval (e.g., q24-48h instead of q8h)',
        'Monitor peak/trough levels',
        'Monitor serum creatinine daily',
      ],
      therapeutic_warnings: [
        { warning: 'Nephrotoxicity risk', context: 'Aminoglycoside + CKD' },
        { warning: 'Ototoxicity risk', context: 'Elevated drug levels' },
      ],
      urgency: 'HIGH',
    } as RuleOutputs,
    updated_at: new Date(),
    created_by: 'system_seed',
  },

  {
    name: 'Opioid Overdose Risk (Age > 65)',
    description: 'Elderly patients have reduced opioid metabolism and increased overdose risk',
    category: 'OVERDOSE',
    severity: 'HIGH',
    priority: 80,
    enabled: true,
    trigger_type: 'MEDICATION + AGE',
    version: 1,
    tags: ['opioid', 'elderly', 'overdose'],
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'MEDICATION',
          field: 'medications.category',
          operator: 'includes',
          value: 'OPIOID',
        },
        {
          type: 'AGE',
          field: 'patient.age',
          operator: '>',
          value: 65,
        },
      ],
    } as RuleGroup,
    outputs: {
      risk_scores: {
        overdose: 25,
      },
      alerts: [
        {
          type: 'safety_alert',
          severity: 'HIGH',
          message: 'Opioid in elderly patient (> 65): Increased overdose risk',
        },
      ],
      recommendations: [
        'Use lowest effective opioid dose',
        'Start with 25-50% of standard dose',
        'Titrate slowly',
        'Prescribe naloxone (Narcan) for rescue',
        'Monitor respiratory rate closely',
      ],
      therapeutic_warnings: [
        { warning: 'Respiratory depression risk', context: 'Opioid in elderly' },
        { warning: 'Fall risk', context: 'Opioid-induced sedation' },
      ],
      urgency: 'HIGH',
    } as RuleOutputs,
    updated_at: new Date(),
    created_by: 'system_seed',
  },
]
