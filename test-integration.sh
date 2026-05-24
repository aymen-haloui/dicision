#!/usr/bin/env bash

# ═══════════════════════════════════════════════════════════════════════════════════
# Clinical CDSS Integration Test Suite
# ═══════════════════════════════════════════════════════════════════════════════════
# This script tests the complete clinical decision engine API integration
# Usage: bash test-integration.sh

set -e

BASE_URL="http://localhost:3000/api/admin/clinical-rules"
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Clinical CDSS Integration Test Suite${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════════${NC}\n"

# ─────────────────────────────────────────────────────────────────────────────────
# TEST 1: Seed rules
# ─────────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}[TEST 1] Seed example rules${NC}"
SEED_RESPONSE=$(curl -s -X POST "$BASE_URL/seed" \
  -H "Content-Type: application/json")

if echo "$SEED_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ PASSED: Rules seeded successfully${NC}\n"
else
  echo -e "${RED}❌ FAILED: Seed failed${NC}"
  echo "$SEED_RESPONSE"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────────
# TEST 2: Get all rules
# ─────────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}[TEST 2] Get all rules${NC}"
GET_RESPONSE=$(curl -s -X GET "$BASE_URL")
RULE_COUNT=$(echo "$GET_RESPONSE" | grep -o '"id"' | wc -l)

if [ "$RULE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ PASSED: Retrieved $RULE_COUNT rules${NC}\n"
else
  echo -e "${RED}❌ FAILED: No rules retrieved${NC}"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────────
# TEST 3: Create valid rule
# ─────────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}[TEST 3] Create valid rule${NC}"

VALID_RULE='{
  "name": "Test Rule - Valid",
  "description": "Testing valid rule creation",
  "category": "TEST",
  "severity": "HIGH",
  "priority": 50,
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
    "alerts": [{"type": "emergency", "severity": "CRITICAL", "message": "Test alert"}]
  }
}'

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "$VALID_RULE")

if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
  CREATED_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✅ PASSED: Created rule with ID $CREATED_ID${NC}\n"
else
  echo -e "${RED}❌ FAILED: Rule creation failed${NC}"
  echo "$CREATE_RESPONSE"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────────
# TEST 4: Create invalid rule (missing name)
# ─────────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}[TEST 4] Create invalid rule (missing name)${NC}"

INVALID_RULE='{
  "category": "TEST",
  "conditions": {"logic": "AND", "conditions": []}
}'

INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "$INVALID_RULE")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ PASSED: Invalid rule rejected with HTTP 400${NC}\n"
else
  echo -e "${RED}❌ FAILED: Expected HTTP 400, got $HTTP_CODE${NC}"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────────
# TEST 5: Simulate rule evaluation
# ─────────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}[TEST 5] Simulate rule evaluation${NC}"

SIMULATION_PAYLOAD='{
  "patient": {
    "id": "test-1",
    "name": "Test Patient",
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
    {"name": "Metformin", "category": "ANTIDIABETIC"},
    {"name": "Warfarin", "category": "ANTICOAGULANT"}
  ]
}'

SIM_RESPONSE=$(curl -s -X POST "$BASE_URL/simulate" \
  -H "Content-Type: application/json" \
  -d "$SIMULATION_PAYLOAD")

if echo "$SIM_RESPONSE" | grep -q "urgency_level\|triggered_rules"; then
  URGENCY=$(echo "$SIM_RESPONSE" | grep -o '"urgency_level":"[^"]*"' | cut -d'"' -f4)
  SCORE=$(echo "$SIM_RESPONSE" | grep -o '"total_risk_score":[0-9.]*' | cut -d':' -f2)
  echo -e "${GREEN}✅ PASSED: Simulation returned urgency=$URGENCY, risk_score=$SCORE${NC}\n"
else
  echo -e "${RED}❌ FAILED: Simulation failed${NC}"
  echo "$SIM_RESPONSE"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────────
# TEST 6: Run unit tests
# ─────────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}[TEST 6] Run unit tests${NC}"

TEST_RESPONSE=$(curl -s -X GET "$BASE_URL/test")

if echo "$TEST_RESPONSE" | grep -q "tests_run"; then
  TEST_COUNT=$(echo "$TEST_RESPONSE" | grep -o '"tests_run":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✅ PASSED: Executed $TEST_COUNT unit tests${NC}\n"
else
  echo -e "${RED}❌ FAILED: Test execution failed${NC}"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────────
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════════${NC}\n"
