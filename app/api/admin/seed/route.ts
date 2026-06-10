import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { PLANT_DRUG_INTERACTION_SEED_RULES, PLANT_SEED_DATA } from '@/lib/plant-clinical-catalog'

const sql = postgres(process.env.DATABASE_URL!)

// This endpoint seeds the database with sample medications and interactions
// Only allow in development or with a secret key

export async function POST(request: NextRequest) {
  try {
    // Check for admin secret (in production, use proper authentication)
    const authHeader = request.headers.get('x-admin-secret')
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Seed medications
    const medications = [
      ['Amoxicillin', 'Amoxicillin', 'Antibiotic', 'Tablet', '500mg', 'May cause allergic reactions. Avoid in penicillin-allergic patients.'],
      ['Metformin', 'Metformin hydrochloride', 'Antidiabetic', 'Tablet', '500mg', 'Risk of lactic acidosis in renal impairment. Monitor renal function.'],
      ['Lisinopril', 'Lisinopril', 'Antihypertensive', 'Tablet', '10mg', 'May cause hyperkalemia. Monitor potassium levels.'],
      ['Warfarin', 'Warfarin', 'Anticoagulant', 'Tablet', '2-10mg', 'Monitor INR regularly. High risk of bleeding interactions.'],
      ['Simvastatin', 'Simvastatin', 'Statin', 'Tablet', '10-40mg', 'Risk of myopathy with certain drug combinations.'],
      ['Aspirin', 'Acetylsalicylic acid', 'Analgesic', 'Tablet', '325-500mg', 'Increased bleeding risk with anticoagulants.'],
      ['Ibuprofen', 'Ibuprofen', 'NSAID', 'Tablet', '200-400mg', 'Gastrointestinal and renal risks, especially with other NSAIDs.'],
      ['Omeprazole', 'Omeprazole', 'Proton pump inhibitor', 'Capsule', '20mg', 'May reduce absorption of other drugs. Monitor drug interactions.'],
      ['Gentamicin', 'Gentamicin sulfate', 'Antibiotic', 'Injection', '3-5mg/kg', 'Nephrotoxic and ototoxic, especially in renal impairment.'],
      ['Vancomycin', 'Vancomycin', 'Antibiotic', 'Injection', '15-20mg/kg', 'Monitor renal function and vancomycin levels.'],
    ]

    for (const [name, generic, category, form, dosage, warnings] of medications) {
      await sql`
        INSERT INTO medications (name, generic_name, category, dosage_form, default_dosage, warnings)
        VALUES (${name}, ${generic}, ${category}, ${form}, ${dosage}, ${warnings})
        ON CONFLICT (name) DO NOTHING
      `
    }

    // Seed plants
    for (const plant of PLANT_SEED_DATA) {
      await sql`
        INSERT INTO plants (name, common_name, toxic_parts, toxic_compounds, toxicity_data, overdose_management)
        VALUES (
          ${plant.name},
          ${plant.commonName},
          ${plant.toxicParts},
          ${plant.toxicCompounds},
          ${sql.json(plant.toxicityData)},
          ${plant.overdoseManagement}
        )
        ON CONFLICT (name) DO UPDATE SET
          common_name = EXCLUDED.common_name,
          toxic_parts = EXCLUDED.toxic_parts,
          toxic_compounds = EXCLUDED.toxic_compounds,
          toxicity_data = EXCLUDED.toxicity_data,
          overdose_management = EXCLUDED.overdose_management
      `
    }

    // Fetch medication IDs
    const medResult = await sql`SELECT id, name FROM medications ORDER BY name`
    const medMap: { [key: string]: string } = {}
    medResult.forEach((med: any) => {
      medMap[med.name] = med.id
    })

    // Seed drug-drug interactions
    const interactionsData = [
      ['Warfarin', 'Aspirin', 'Increased bleeding risk', 'critical', 'Aspirin potentiates anticoagulant effect of warfarin', 'Use alternative to aspirin. If necessary, monitor INR closely.'],
      ['Warfarin', 'Ibuprofen', 'Increased bleeding risk', 'severe', 'NSAIDs increase anticoagulant effect and GI bleeding risk', 'Avoid NSAIDs. Use alternative analgesic like acetaminophen.'],
      ['Metformin', 'Gentamicin', 'Lactic acidosis risk', 'severe', 'Gentamicin may impair renal function, increasing metformin accumulation', 'Monitor renal function closely. Consider temporary metformin discontinuation.'],
      ['Lisinopril', 'Ibuprofen', 'Reduced antihypertensive effect', 'moderate', 'NSAIDs can reduce ACE inhibitor effectiveness and increase renal risk', 'Use alternative analgesic. Monitor blood pressure.'],
      ['Simvastatin', 'Omeprazole', 'Increased statin levels', 'moderate', 'Omeprazole inhibits metabolism of simvastatin', 'Monitor for myopathy symptoms. Consider dose reduction or alternative statin.'],
      ['Amoxicillin', 'Warfarin', 'Increased INR', 'moderate', 'Antibiotics may increase warfarin effect', 'Monitor INR closely during and after antibiotic course.'],
    ]

    for (const [med1, med2, type, severity, desc, rec] of interactionsData) {
      const id1 = medMap[med1]
      const id2 = medMap[med2]

      if (id1 && id2) {
        await sql`
          INSERT INTO interactions (medication_id_1, medication_id_2, interaction_type, severity, description, recommendation)
          VALUES (${id1}, ${id2}, ${type}, ${severity}, ${desc}, ${rec})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // Fetch plant IDs
    const plantResult = await sql`SELECT id, name FROM plants ORDER BY name`
    const plantMap: { [key: string]: string } = {}
    plantResult.forEach((plant: any) => {
      plantMap[plant.name] = plant.id
    })

    let plantDrugInteractionsAdded = 0
    for (const rule of PLANT_DRUG_INTERACTION_SEED_RULES) {
      const plantId = plantMap[rule.plantName]
      if (!plantId) continue

      for (const medicationMatcher of rule.medicationMatchers) {
        const meds = await sql`
          SELECT id, name
          FROM medications
          WHERE LOWER(name) = LOWER(${medicationMatcher})
             OR LOWER(generic_name) = LOWER(${medicationMatcher})
          LIMIT 1
        `

        if (meds.length === 0) continue

        const medicationId = meds[0].id
        await sql`
          INSERT INTO plant_drug_interactions (plant_id, medication_id, severity, description, recommendation)
          VALUES (
            ${plantId},
            ${medicationId},
            ${rule.severity},
            ${rule.description},
            ${rule.recommendation}
          )
          ON CONFLICT DO NOTHING
        `
        plantDrugInteractionsAdded++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      medicationsAdded: medications.length,
      interactionsAdded: interactionsData.length,
      plantsAdded: PLANT_SEED_DATA.length,
      plantDrugInteractionsAttempted: plantDrugInteractionsAdded,
    })
  } catch (error: any) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    )
  }
}
