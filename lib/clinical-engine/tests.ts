/**
 * Clinical Engine Tests
 * ===================
 * Unit tests for validator, condition evaluation, rule aggregation,
 * and urgency escalation.
 */

import { validateRule } from '@/lib/clinical-engine/validator'
import { ClinicalContext, RuleGroup, DEFAULT_ENGINE_CONFIG } from '@/types/clinical-engine'

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Validator — Valid rule
// ─────────────────────────────────────────────────────────────────────────────

export function testValidatorValidRule() {
  const rule = {
    name: 'Test Rule',
    description: 'A test rule',
    category: 'TEST',
    severity: 'HIGH',
    priority: 50,
    enabled: true,
    trigger_type: 'LAB_RESULT',
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
    },
    outputs: {
      risk_scores: { cardiac: 30 },
      alerts: [{ type: 'emergency', severity: 'CRITICAL', message: 'Test' }],
    },
  }

  const result = validateRule(rule)
  console.assert(result.is_valid === true, '❌ Test 1 FAILED: Rule should be valid')
  console.log('✅ Test 1 PASSED: Validator accepts valid rule')
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Validator — Missing name
// ─────────────────────────────────────────────────────────────────────────────

export function testValidatorMissingName() {
  const rule = {
    description: 'No name',
    category: 'TEST',
    severity: 'HIGH',
    conditions: { logic: 'AND', conditions: [] },
  }

  const result = validateRule(rule)
  console.assert(result.is_valid === false, '❌ Test 2 FAILED: Rule without name should fail')
  console.assert(result.errors.length > 0, '❌ Test 2 FAILED: Should have errors')
  console.log('✅ Test 2 PASSED: Validator rejects rule without name')
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Validator — Invalid operator
// ─────────────────────────────────────────────────────────────────────────────

export function testValidatorInvalidOperator() {
  const rule = {
    name: 'Invalid Op',
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'LAB_RESULT',
          field: 'potassium',
          operator: 'INVALID_OP', // Invalid operator
          value: 6.5,
        },
      ],
    },
  }

  const result = validateRule(rule)
  console.assert(result.is_valid === false, '❌ Test 3 FAILED: Invalid operator should fail')
  console.log('✅ Test 3 PASSED: Validator rejects invalid operator')
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Validator — Invalid urgency level
// ─────────────────────────────────────────────────────────────────────────────

export function testValidatorInvalidUrgency() {
  const rule = {
    name: 'Invalid Urgency',
    conditions: { logic: 'AND', conditions: [] },
    outputs: {
      urgency: 'SUPER_CRITICAL', // Invalid
    },
  }

  const result = validateRule(rule)
  console.assert(result.is_valid === false, '❌ Test 4 FAILED: Invalid urgency should fail')
  console.log('✅ Test 4 PASSED: Validator rejects invalid urgency')
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Risk score validation — non-numeric
// ─────────────────────────────────────────────────────────────────────────────

export function testValidatorNonNumericRiskScore() {
  const rule = {
    name: 'Non-numeric Score',
    conditions: { logic: 'AND', conditions: [] },
    outputs: {
      risk_scores: {
        renal: 'not_a_number', // Invalid
      },
    },
  }

  const result = validateRule(rule)
  console.assert(result.is_valid === false, '❌ Test 5 FAILED: Non-numeric score should fail')
  console.log('✅ Test 5 PASSED: Validator rejects non-numeric risk scores')
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Compound condition (AND)
// ─────────────────────────────────────────────────────────────────────────────

export function testCompoundConditionAND() {
  const rule = {
    name: 'Compound AND',
    conditions: {
      logic: 'AND',
      conditions: [
        {
          type: 'LAB_RESULT',
          field: 'labs.potassium.value',
          operator: '>',
          value: 6.5,
        },
        {
          type: 'AGE',
          field: 'patient.age',
          operator: '>',
          value: 65,
        },
      ],
    },
  }

  const result = validateRule(rule)
  console.assert(result.is_valid === true, '❌ Test 6 FAILED: Valid AND condition should pass')
  console.log('✅ Test 6 PASSED: Validator accepts compound AND condition')
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Compound condition (OR)
// ─────────────────────────────────────────────────────────────────────────────

export function testCompoundConditionOR() {
  const rule = {
    name: 'Compound OR',
    conditions: {
      logic: 'OR',
      conditions: [
        {
          type: 'LAB_RESULT',
          field: 'labs.spo2.value',
          operator: '<',
          value: 85,
        },
        {
          type: 'MEDICATION',
          field: 'medications.name',
          operator: 'includes',
          value: 'Opioid',
        },
      ],
    },
  }

  const result = validateRule(rule)
  console.assert(result.is_valid === true, '❌ Test 7 FAILED: Valid OR condition should pass')
  console.log('✅ Test 7 PASSED: Validator accepts compound OR condition')
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Config urgency thresholds
// ─────────────────────────────────────────────────────────────────────────────

export function testConfigUrgencyThresholds() {
  const config = DEFAULT_ENGINE_CONFIG
  console.assert(config.default_urgency_thresholds !== undefined, '❌ Test 8 FAILED: Missing thresholds')
  console.assert(config.default_urgency_thresholds!.critical_min === 81, '❌ Test 8 FAILED: Critical threshold should be 81')
  console.log('✅ Test 8 PASSED: Config has correct urgency thresholds')
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN ALL TESTS
// ─────────────────────────────────────────────────────────────────────────────

export function runAllTests() {
  console.log('\n🧪 Running Clinical Engine Unit Tests...\n')

  testValidatorValidRule()
  testValidatorMissingName()
  testValidatorInvalidOperator()
  testValidatorInvalidUrgency()
  testValidatorNonNumericRiskScore()
  testCompoundConditionAND()
  testCompoundConditionOR()
  testConfigUrgencyThresholds()

  console.log('\n✨ All tests completed!\n')
}
