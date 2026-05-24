-- CreateTable
CREATE TABLE "rules_audit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID,
    "rule_id" UUID,
    "rule_name" VARCHAR(255),
    "matched_conditions" JSONB,
    "outputs_applied" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rules_audit_pkey" PRIMARY KEY ("id")
);
