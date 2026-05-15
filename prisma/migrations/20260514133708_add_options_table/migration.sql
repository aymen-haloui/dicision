-- CreateTable
CREATE TABLE "case_medications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "medication_id" UUID NOT NULL,
    "dosage" VARCHAR(100),
    "frequency" VARCHAR(100),
    "duration" VARCHAR(100),
    "route" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "case_type" VARCHAR(50) NOT NULL,
    "chief_complaint" TEXT,
    "symptoms" TEXT,
    "vital_signs" JSONB DEFAULT '{}',
    "status" VARCHAR(50) DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medication_id_1" UUID NOT NULL,
    "medication_id_2" UUID NOT NULL,
    "interaction_type" VARCHAR(255),
    "severity" VARCHAR(50),
    "description" TEXT,
    "recommendation" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "generic_name" VARCHAR(255),
    "category" VARCHAR(255),
    "dosage_form" VARCHAR(100),
    "default_dosage" VARCHAR(100),
    "warnings" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "contraindications" JSONB DEFAULT '[]',
    "max_daily_dose_adult" DECIMAL,
    "max_daily_dose_child" DECIMAL,
    "toxicity_thresholds" JSONB DEFAULT '{}',
    "overdose_management" TEXT,
    "pharmacological_data" JSONB DEFAULT '{}',

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" VARCHAR(100) NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(50),
    "medical_record_number" VARCHAR(100),
    "allergies" TEXT,
    "comorbidities" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL,
    "renal_creatinine_clearance" DECIMAL,
    "hepatic_status" VARCHAR(50),
    "pregnancy_status" VARCHAR(50),
    "height" DECIMAL(5,1),
    "smoking_status" VARCHAR(50) DEFAULT 'non-smoker',
    "alcohol_use" VARCHAR(50) DEFAULT 'none',
    "substance_use" TEXT,
    "professional_exposure" TEXT,
    "physical_activity" VARCHAR(50),
    "diet_type" TEXT,
    "stress_level" VARCHAR(50),
    "sleep_quality" VARCHAR(50),
    "sleep_hours" DECIMAL(3,1),
    "night_shift" BOOLEAN DEFAULT false,
    "sun_exposure" VARCHAR(50),
    "prolonged_fasting" BOOLEAN DEFAULT false,
    "restrictive_diet" BOOLEAN DEFAULT false,
    "uncontrolled_natural_products" BOOLEAN DEFAULT false,
    "blood_donor" BOOLEAN DEFAULT false,
    "immunodepression" VARCHAR(50) DEFAULT 'none',
    "sudden_medication_stop" BOOLEAN DEFAULT false,
    "regular_checkup" BOOLEAN DEFAULT true,
    "self_diagnosis" BOOLEAN DEFAULT false,
    "housing_conditions" TEXT,
    "previous_intoxication" BOOLEAN DEFAULT false,
    "allergy_reaction_types" TEXT,
    "creatinine" DECIMAL(6,2),
    "renal_stage" VARCHAR(20),
    "asat" DECIMAL(8,2),
    "alat" DECIMAL(8,2),
    "bilirubin" DECIMAL(6,2),
    "glycemia" DECIMAL(6,2),
    "sodium" DECIMAL(6,2),
    "potassium" DECIMAL(5,2),
    "crp" DECIMAL(8,2),
    "lactates" DECIMAL(6,2),
    "extended_profile" JSONB DEFAULT '{}',

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_drug_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plant_id" UUID NOT NULL,
    "medication_id" UUID NOT NULL,
    "severity" VARCHAR(50),
    "description" TEXT,
    "recommendation" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_drug_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "common_name" VARCHAR(255),
    "toxic_parts" TEXT,
    "toxic_compounds" TEXT,
    "toxicity_data" JSONB DEFAULT '{}',
    "overdose_management" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "risk_score" DECIMAL(5,2),
    "risk_level" VARCHAR(50),
    "findings" JSONB DEFAULT '{}',
    "recommendations" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "specialization" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medications_name_key" ON "medications"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Option_category_value_key" ON "Option"("category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "plants_name_key" ON "plants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "case_medications" ADD CONSTRAINT "case_medications_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "case_medications" ADD CONSTRAINT "case_medications_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_medication_id_1_fkey" FOREIGN KEY ("medication_id_1") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_medication_id_2_fkey" FOREIGN KEY ("medication_id_2") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plant_drug_interactions" ADD CONSTRAINT "plant_drug_interactions_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plant_drug_interactions" ADD CONSTRAINT "plant_drug_interactions_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
