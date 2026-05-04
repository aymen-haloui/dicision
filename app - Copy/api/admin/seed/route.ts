import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

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

    // Check if medications already exist
    const existing = await sql`SELECT COUNT(*) as count FROM medications`
    if (existing[0]?.count > 0) {
      return NextResponse.json({
        message: 'Medications already seeded',
        count: existing[0].count,
      })
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

    // Fetch medication IDs
    const medResult = await sql`SELECT id, name FROM medications ORDER BY name`
    const medMap: { [key: string]: string } = {}
    medResult.forEach((med: any) => {
      medMap[med.name] = med.id
    })

    // Seed interactions
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

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      medicationsAdded: medications.length,
      interactionsAdded: interactionsData.length,
    })
  } catch (error: any) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    )
  }
}
