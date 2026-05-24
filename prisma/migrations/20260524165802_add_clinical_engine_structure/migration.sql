/*
  Warnings:

  - You are about to drop the column `vital_signs` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `alat` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `allergies` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `allergy_reaction_types` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `asat` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `bilirubin` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `blood_donor` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `comorbidities` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `creatinine` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `crp` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `diet_type` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `extended_profile` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `glycemia` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `hepatic_status` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `housing_conditions` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `immunodepression` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `lactates` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `night_shift` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `potassium` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `previous_intoxication` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `professional_exposure` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `prolonged_fasting` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `regular_checkup` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `renal_creatinine_clearance` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `renal_stage` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `restrictive_diet` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `self_diagnosis` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `sleep_hours` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `sodium` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `substance_use` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `sudden_medication_stop` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `sun_exposure` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `uncontrolled_natural_products` on the `patients` table. All the data in the column will be lost.
  - You are about to alter the column `weight` on the `patients` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(5,2)`.
  - The `pregnancy_status` column on the `patients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `height` on the `patients` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,1)` to `Decimal(5,2)`.
  - A unique constraint covering the columns `[medical_record_number]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "patient_lifestyle" DROP CONSTRAINT "patient_lifestyle_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_user_id_fkey";

-- AlterTable
ALTER TABLE "cases" DROP COLUMN "vital_signs",
ADD COLUMN     "priority_level" VARCHAR(20);

-- AlterTable
ALTER TABLE "patient_lifestyle" ADD COLUMN     "blood_donor" BOOLEAN DEFAULT false,
ADD COLUMN     "diet_type" TEXT,
ADD COLUMN     "housing_conditions" TEXT,
ADD COLUMN     "immunodepression" VARCHAR(50),
ADD COLUMN     "night_shift" BOOLEAN DEFAULT false,
ADD COLUMN     "previous_intoxication" BOOLEAN DEFAULT false,
ADD COLUMN     "prolonged_fasting" BOOLEAN DEFAULT false,
ADD COLUMN     "regular_checkup" BOOLEAN DEFAULT true,
ADD COLUMN     "restrictive_diet" BOOLEAN DEFAULT false,
ADD COLUMN     "self_diagnosis" BOOLEAN DEFAULT false,
ADD COLUMN     "sleep_hours" DECIMAL(3,1),
ADD COLUMN     "sudden_medication_stop" BOOLEAN DEFAULT false,
ADD COLUMN     "sun_exposure" VARCHAR(50),
ADD COLUMN     "uncontrolled_natural_products" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "alat",
DROP COLUMN "allergies",
DROP COLUMN "allergy_reaction_types",
DROP COLUMN "asat",
DROP COLUMN "bilirubin",
DROP COLUMN "blood_donor",
DROP COLUMN "comorbidities",
DROP COLUMN "creatinine",
DROP COLUMN "crp",
DROP COLUMN "diet_type",
DROP COLUMN "extended_profile",
DROP COLUMN "glycemia",
DROP COLUMN "hepatic_status",
DROP COLUMN "housing_conditions",
DROP COLUMN "immunodepression",
DROP COLUMN "lactates",
DROP COLUMN "night_shift",
DROP COLUMN "potassium",
DROP COLUMN "previous_intoxication",
DROP COLUMN "professional_exposure",
DROP COLUMN "prolonged_fasting",
DROP COLUMN "regular_checkup",
DROP COLUMN "renal_creatinine_clearance",
DROP COLUMN "renal_stage",
DROP COLUMN "restrictive_diet",
DROP COLUMN "self_diagnosis",
DROP COLUMN "sleep_hours",
DROP COLUMN "sodium",
DROP COLUMN "substance_use",
DROP COLUMN "sudden_medication_stop",
DROP COLUMN "sun_exposure",
DROP COLUMN "uncontrolled_natural_products",
ADD COLUMN     "breastfeeding_status" BOOLEAN DEFAULT false,
ADD COLUMN     "pregnancy_trimester" VARCHAR(20),
ALTER COLUMN "weight" SET DATA TYPE DECIMAL(5,2),
DROP COLUMN "pregnancy_status",
ADD COLUMN     "pregnancy_status" BOOLEAN DEFAULT false,
ALTER COLUMN "height" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "smoking_status" DROP DEFAULT,
ALTER COLUMN "alcohol_use" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_image" TEXT;

-- CreateTable
CREATE TABLE "clinical_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger_type" VARCHAR(100),
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "outputs" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" VARCHAR(255),
    "version" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "clinical_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "condition_name" TEXT NOT NULL,
    "category" TEXT,
    "severity" TEXT,
    "status" TEXT,
    "diagnosed_at" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_allergies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "allergen_name" TEXT NOT NULL,
    "allergen_category" TEXT,
    "reaction_type" TEXT,
    "severity" TEXT,
    "onset_delay" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_medications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "medication_id" UUID NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "route" TEXT,
    "started_at" DATE,
    "ongoing" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_vitals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "heart_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "temperature_c" DECIMAL(4,1),
    "spo2" INTEGER,
    "consciousness_state" TEXT,
    "measured_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_lab_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "test_name" TEXT NOT NULL,
    "value" DECIMAL(10,2),
    "unit" TEXT,
    "abnormal_flag" TEXT,
    "measured_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_symptoms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "symptom_name" TEXT NOT NULL,
    "severity" TEXT,
    "duration" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_emergency_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "convulsions" BOOLEAN DEFAULT false,
    "respiratory_distress" BOOLEAN DEFAULT false,
    "hemodynamic_instability" BOOLEAN DEFAULT false,
    "coma" BOOLEAN DEFAULT false,
    "cardiac_arrest" BOOLEAN DEFAULT false,
    "severe_arrhythmia" BOOLEAN DEFAULT false,
    "severe_allergic_reaction" BOOLEAN DEFAULT false,
    "major_bleeding" BOOLEAN DEFAULT false,
    "urgency_level" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_emergency_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_medical_record_number_key" ON "patients"("medical_record_number");

-- AddForeignKey
ALTER TABLE "patient_conditions" ADD CONSTRAINT "patient_conditions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_lifestyle" ADD CONSTRAINT "patient_lifestyle_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_vitals" ADD CONSTRAINT "case_vitals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_lab_results" ADD CONSTRAINT "case_lab_results_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_symptoms" ADD CONSTRAINT "case_symptoms_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_emergency_flags" ADD CONSTRAINT "case_emergency_flags_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
