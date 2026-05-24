# Clinical CDSS Engine - Complete Implementation Guide

## Overview

This is a **Professional Clinical Decision Support System (CDSS)** built with:
- ✅ Centralized medical rule engine (no hardcoded logic)
- ✅ Configurable priorities, versioning, and audit trails
- ✅ Type-safe TypeScript throughout
- ✅ Deterministic rule evaluation
- ✅ Risk score aggregation
- ✅ Urgency escalation
- ✅ Full explainability

## Architecture

### Core Components

#### 1. **types/clinical-engine.ts** — Single Source of Truth
Defines all clinical data structures:
- `ClinicalContext` - Patient data input
- `ClinicalRuleDefinition` - Rule structure
- `RuleGroup` - AND/OR condition logic
- `RuleOutputs` - Scoring, alerts, contraindications
- `ClinicalEngineResult` - Complete evaluation result

#### 2. **lib/clinical-engine/engine.ts** — Rule Evaluation
```typescript
evaluateRulesForContext(context, caseId, config)
```
- Loads enabled rules (priority DESC)
- Evaluates conditions recursively (AND/OR groups)
- Aggregates risk scores by category
- Records audit trail
- Escalates urgency automatically

#### 3. **lib/clinical-engine/validator.ts** — Pre-Save Validation
```typescript
validateRule(rule)
```
- Validates conditions, operators, urgency levels
- Checks risk scores are numeric
- Returns field-specific error messages
- Prevents invalid rules from being saved

#### 4. **lib/clinical-engine/audit.ts** — Audit Trail
```typescript
recordRuleAudit(caseId, ruleId, ruleName, matchedConditions, outputsApplied)
```
- Stores triggered rules to database
- Links to cases for explainability
- Tracks matched conditions and applied outputs

#### 5. **lib/clinical-engine/seed-rules.ts** — Example Rules
6 realistic clinical rules demonstrating:
- Metformin + CKD (renal toxicity)
- Warfarin + NSAID (bleeding risk)
- Hyperkalemia (cardiac emergency)
- Respiratory failure (SpO2 < 85%)
- ACE inhibitor + K-sparing diuretic
- Gentamicin dosing in CKD

## Database Schema

### `clinical_rules` Table
```sql
- id (UUID)
- name (VARCHAR 255) — Rule name
- description (TEXT) — What this rule checks
- category (VARCHAR 100) — RENAL, CARDIAC, INTERACTION, etc.
- severity (VARCHAR 50) — LOW, MODERATE, HIGH, CRITICAL
- priority (INT 0-100) — 0=lowest, 100=highest
- enabled (BOOLEAN) — Enable/disable without deleting
- conditions (JSON) — RuleGroup structure
- outputs (JSON) — RuleOutputs structure
- version (INT) — Incremented on each edit
- tags (TEXT[]) — Searchable tags
- created_by (VARCHAR 255) — Audit trail
- created_at, updated_at (TIMESTAMP)
```

### `rules_audit` Table
```sql
- id (UUID)
- case_id (UUID, nullable) — Which case triggered this
- rule_id (UUID) — Which rule
- rule_name (VARCHAR 255)
- matched_conditions (JSON) — What conditions matched
- outputs_applied (JSON) — What outputs were applied
- created_at (TIMESTAMP)
```

## API Endpoints

### Rule Management

#### **POST /api/admin/clinical-rules** — Create Rule
```bash
curl -X POST http://localhost:3000/api/admin/clinical-rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rule Name",
    "description": "What this rule does",
    "category": "RENAL",
    "severity": "HIGH",
    "priority": 75,
    "enabled": true,
    "conditions": {
      "logic": "AND",
      "conditions": [{
        "type": "LAB_RESULT",
        "field": "labs.potassium.value",
        "operator": ">",
        "value": 6.5
      }]
    },
    "outputs": {
      "risk_scores": {"cardiac": 30},
      "alerts": [{"type": "emergency", "severity": "CRITICAL", "message": "..."}],
      "urgency": "CRITICAL"
    }
  }'
```

**Validation Pipeline:**
1. Checks for required fields (name, category, severity)
2. Validates condition operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `includes`, `not_includes`
3. Validates condition types: `LAB_RESULT`, `MEDICATION`, `VITAL_SIGN`, `AGE`, `CONDITION`, `ALLERGY`, `SYMPTOM`, `EMERGENCY_FLAG`, `CUSTOM`
4. Ensures risk scores are numeric
5. If all valid → INSERT with `version=1`, `created_by=userId`
6. Returns **HTTP 201** with created rule or **HTTP 400** with errors

#### **GET /api/admin/clinical-rules** — List All Rules
```bash
curl http://localhost:3000/api/admin/clinical-rules
```
- Returns all rules sorted by `priority DESC, created_at DESC`
- Includes all fields: id, name, description, category, severity, priority, enabled, version, tags, created_by, created_at

#### **GET /api/admin/clinical-rules/:id** — Get Single Rule
```bash
curl http://localhost:3000/api/admin/clinical-rules/abc-123
```

#### **PUT /api/admin/clinical-rules/:id** — Update Rule
```bash
curl -X PUT http://localhost:3000/api/admin/clinical-rules/abc-123 \
  -H "Content-Type: application/json" \
  -d '{ "priority": 85, ... }'
```
- Validates using same pipeline as POST
- Increments `version` automatically
- Returns **HTTP 200** with updated rule

#### **DELETE /api/admin/clinical-rules/:id** — Delete Rule
```bash
curl -X DELETE http://localhost:3000/api/admin/clinical-rules/abc-123
```

#### **PATCH /api/admin/clinical-rules/:id/toggle** — Enable/Disable
```bash
curl -X PATCH http://localhost:3000/api/admin/clinical-rules/abc-123/toggle
```
- Toggles `enabled` field without changing version
- Fast operation for enabling/disabling rules

#### **GET /api/admin/clinical-rules/search?category=RENAL&enabled=true&tag=metformin&search=kidney** — Search & Filter
```bash
curl "http://localhost:3000/api/admin/clinical-rules/search?category=RENAL&severity=HIGH"
```

### Evaluation & Testing

#### **POST /api/admin/clinical-rules/simulate** — Test Rule Engine
```bash
curl -X POST http://localhost:3000/api/admin/clinical-rules/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {
      "id": "p1",
      "name": "John Doe",
      "age": 72,
      "gender": "M"
    },
    "labs": {
      "potassium": {"value": 6.8, "unit": "mEq/L"},
      "eGFR": {"value": 25, "unit": "mL/min"}
    },
    "vitals": {
      "spo2": 84,
      "heartRate": 110
    },
    "medications": [
      {"name": "Metformin", "category": "ANTIDIABETIC"}
    ]
  }'
```

**Returns: ClinicalEngineResult**
```json
{
  "total_risk_score": 65.0,
  "urgency_level": "CRITICAL",
  "risk_scores": {
    "renal": 35,
    "toxicity": 25,
    "respiratory": 5
  },
  "triggered_rules": [
    {
      "rule_id": "rule-123",
      "rule_name": "Metformin + CKD Stage 4-5",
      "priority": 95,
      "explanation": "Rule matched conditions...",
      "outputs_applied": { ... }
    }
  ],
  "alerts": [ ... ],
  "contraindications": [ ... ],
  "recommendations": [ ... ],
  "evaluation_timestamp": "2025-05-24T17:30:00Z"
}
```

#### **GET /api/admin/clinical-rules/audit?case_id=xyz** — View Audit Trail
```bash
curl "http://localhost:3000/api/admin/clinical-rules/audit?case_id=abc-123"
```
- Returns all triggered rules for a case
- Shows matched conditions and applied outputs
- Sortable by triggered_at

### Administration

#### **POST /api/admin/clinical-rules/seed** — Seed Example Rules
```bash
curl -X POST http://localhost:3000/api/admin/clinical-rules/seed
```
- Inserts 6 realistic clinical rules
- Idempotent (skips if rules already exist)
- Good for demo and testing

#### **GET /api/admin/clinical-rules/test** — Run Unit Tests
```bash
curl http://localhost:3000/api/admin/clinical-rules/test
```
- Executes 8 unit tests
- Tests validator, conditions, aggregation
- Returns logs and pass/fail status

## How It Works

### Example: Metformin + CKD Rule Trigger

1. **Rule Definition** (stored in database)
   ```javascript
   {
     name: "Metformin + CKD Stage 4-5",
     category: "RENAL",
     priority: 95,
     conditions: {
       logic: "AND",
       conditions: [
         { field: "medications.name", operator: "includes", value: "Metformin" },
         { field: "labs.eGFR.value", operator: "<", value: 30 }
       ]
     },
     outputs: {
       risk_scores: { renal: 35, toxicity: 25 },
       alerts: [{ type: "contraindication", severity: "CRITICAL", message: "..." }],
       urgency: "CRITICAL"
     }
   }
   ```

2. **Patient Context** (runtime input)
   ```javascript
   {
     patient: { age: 72, ... },
     labs: { eGFR: 25 },  // ← Triggers eGFR < 30
     medications: [
       { name: "Metformin", ... }  // ← Triggers includes "Metformin"
     ]
   }
   ```

3. **Condition Evaluation**
   - Evaluate AND group:
     - ✅ "Metformin" includes in medications → true
     - ✅ 25 < 30 → true
     - AND(true, true) → **true** → Rule triggers

4. **Aggregate Outputs**
   - Add risk_scores: renal += 35, toxicity += 25
   - Collect alerts: ["CRITICAL: ABSOLUTE CONTRAINDICATION"]
   - Set urgency: CRITICAL

5. **Final Result**
   ```javascript
   {
     total_risk_score: 65,
     urgency_level: "CRITICAL",
     triggered_rules: [
       {
         rule_name: "Metformin + CKD Stage 4-5",
         priority: 95,
         outputs_applied: { ... }
       }
     ],
     alerts: [ ... ],
     contraindications: [ ... ]
   }
   ```

6. **Audit Trail**
   - INSERT into rules_audit: case_id, rule_id, matched_conditions, outputs_applied
   - Permanent record for explainability

## Urgency Escalation

Based on total risk score:
- **LOW**: 0-20
- **MODERATE**: 21-50
- **HIGH**: 51-80
- **CRITICAL**: 81-100

Also escalates if any rule sets explicit urgency level.

## Usage Examples

### CLI Testing
```bash
# Seed example rules
bash test-integration.sh

# Run specific test
curl -X POST http://localhost:3000/api/admin/clinical-rules \
  -H "Content-Type: application/json" \
  -d @rule.json
```

### Admin Dashboard
Visit: `http://localhost:3000/dashboard/admin/clinical-rules`
- Seed example rules
- Run unit tests
- View system status

### Sandbox Testing
Visit: `http://localhost:3000/dashboard/admin/clinical-sandbox`
- Adjust patient labs/vitals
- See triggered rules in real-time
- View risk score breakdown
- Read recommendations and alerts

## Type Safety

All data is **strongly typed**:

```typescript
// Compile-time checks prevent runtime errors
const rule: ClinicalRuleDefinition = {
  name: "...",
  conditions: {
    logic: "AND", // ✅ Must be "AND" or "OR"
    conditions: [
      {
        operator: ">" // ✅ Must be from ALLOWED_OPERATORS
      }
    ]
  },
  outputs: {
    risk_scores: {
      renal: 25 // ✅ Must be numeric
    },
    urgency: "CRITICAL" // ✅ Must be valid UrgencyLevel
  }
}
```

## Key Features

1. **No Hardcoded Logic** — All rules are in database
2. **Configurable** — Adjust priorities, enable/disable, update conditions
3. **Versionable** — Every change tracked with version number
4. **Auditable** — Complete record of which rules triggered when
5. **Explicable** — Every decision shows which rules triggered
6. **Type-Safe** — Impossible to create invalid rules
7. **Fast** — Efficiently evaluates rules with deterministic logic
8. **Scalable** — Easy to add new rules without code changes

## Next Steps

1. Connect admin UI to CRUD endpoints (currently shows JSON forms)
2. Add more realistic clinical rules (warfarin interactions, cardiac rules, etc.)
3. Implement user/role-based access control for rules
4. Add rule versioning UI (view history, rollback)
5. Create reporting dashboard (which rules trigger most often, etc.)
6. Integrate with patient workflows
