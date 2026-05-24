/**
 * Audit Service
 * =============
 * Stores triggered rules and their outcomes for audit and explainability.
 */

import { TriggeredRule } from '@/types/clinical-engine'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

export async function recordRuleAudit(
  caseId: string | null,
  ruleId: string,
  ruleName: string,
  matchedConditions: any,
  outputsApplied: any
) {
  try {
    await sql`
      INSERT INTO rules_audit (case_id, rule_id, rule_name, matched_conditions, outputs_applied)
      VALUES (
        ${caseId},
        ${ruleId},
        ${ruleName},
        ${JSON.stringify(matchedConditions)},
        ${JSON.stringify(outputsApplied)}
      )
    `
  } catch (error) {
    console.error('Failed to record rule audit:', error)
  }
}

export async function getAuditForCase(caseId: string) {
  try {
    const records = await sql`
      SELECT id, case_id, rule_id, rule_name, matched_conditions, outputs_applied, created_at
      FROM rules_audit
      WHERE case_id = ${caseId}
      ORDER BY created_at DESC
    `
    return records
  } catch (error) {
    console.error('Failed to get audit records:', error)
    return []
  }
}

export async function getAuditForRule(ruleId: string, limit = 100) {
  try {
    const records = await sql`
      SELECT id, case_id, rule_id, rule_name, matched_conditions, outputs_applied, created_at
      FROM rules_audit
      WHERE rule_id = ${ruleId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return records
  } catch (error) {
    console.error('Failed to get audit records for rule:', error)
    return []
  }
}

export async function getAllAuditRecords(limit = 500) {
  try {
    const records = await sql`
      SELECT id, case_id, rule_id, rule_name, matched_conditions, outputs_applied, created_at
      FROM rules_audit
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return records
  } catch (error) {
    console.error('Failed to get all audit records:', error)
    return []
  }
}
