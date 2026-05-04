import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function seedMedications() {
  const medications = [
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      category: 'Antibiotic',
      dosageForm: 'Tablet',
      defaultDosage: '500mg',
      warnings: 'May cause allergic reactions. Avoid in penicillin-allergic patients.',
    },
    {
      name: 'Metformin',
      genericName: 'Metformin hydrochloride',
      category: 'Antidiabetic',
      dosageForm: 'Tablet',
      defaultDosage: '500mg',
      warnings: 'Risk of lactic acidosis in renal impairment. Monitor renal function.',
    },
    {
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      category: 'Antihypertensive',
      dosageForm: 'Tablet',
      defaultDosage: '10mg',
      warnings: 'May cause hyperkalemia. Monitor potassium levels.',
    },
    {
      name: 'Warfarin',
      genericName: 'Warfarin',
      category: 'Anticoagulant',
      dosageForm: 'Tablet',
      defaultDosage: '2-10mg',
      warnings: 'Monitor INR regularly. High risk of bleeding interactions.',
    },
    {
      name: 'Simvastatin',
      genericName: 'Simvastatin',
      category: 'Statin',
      dosageForm: 'Tablet',
      defaultDosage: '10-40mg',
      warnings: 'Risk of myopathy with certain drug combinations.',
    },
    {
      name: 'Aspirin',
      genericName: 'Acetylsalicylic acid',
      category: 'Analgesic',
      dosageForm: 'Tablet',
      defaultDosage: '325-500mg',
      warnings: 'Increased bleeding risk with anticoagulants.',
    },
    {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      category: 'NSAID',
      dosageForm: 'Tablet',
      defaultDosage: '200-400mg',
      warnings: 'Gastrointestinal and renal risks, especially with other NSAIDs.',
    },
    {
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      category: 'Proton pump inhibitor',
      dosageForm: 'Capsule',
      defaultDosage: '20mg',
      warnings: 'May reduce absorption of other drugs. Monitor drug interactions.',
    },
    {
      name: 'Gentamicin',
      genericName: 'Gentamicin sulfate',
      category: 'Antibiotic',
      dosageForm: 'Injection',
      defaultDosage: '3-5mg/kg',
      warnings: 'Nephrotoxic and ototoxic, especially in renal impairment.',
    },
    {
      name: 'Vancomycin',
      genericName: 'Vancomycin',
      category: 'Antibiotic',
      dosageForm: 'Injection',
      defaultDosage: '15-20mg/kg',
      warnings: 'Monitor renal function and vancomycin levels.',
    },
  ]

  console.log('Seeding medications...')

  for (const med of medications) {
    try {
      await sql`
        INSERT INTO medications (name, generic_name, category, dosage_form, default_dosage, warnings)
        VALUES (${med.name}, ${med.genericName}, ${med.category}, ${med.dosageForm}, ${med.defaultDosage}, ${med.warnings})
        ON CONFLICT (name) DO NOTHING
      `
      console.log(`✓ ${med.name}`)
    } catch (error) {
      console.error(`✗ ${med.name}:`, error)
    }
  }

  console.log('\nFetching medication IDs for interactions...')

  // Fetch medication IDs
  const result = await sql`SELECT id, name FROM medications ORDER BY name`
  const medMap: { [key: string]: string } = {}

  result.forEach((med: any) => {
    medMap[med.name] = med.id
  })

  // Create interactions
  const interactions = [
    {
      med1: 'Warfarin',
      med2: 'Aspirin',
      type: 'Increased bleeding risk',
      severity: 'critical',
      description: 'Aspirin potentiates anticoagulant effect of warfarin',
      recommendation: 'Use alternative to aspirin. If necessary, monitor INR closely.',
    },
    {
      med1: 'Warfarin',
      med2: 'Ibuprofen',
      type: 'Increased bleeding risk',
      severity: 'severe',
      description: 'NSAIDs increase anticoagulant effect and GI bleeding risk',
      recommendation: 'Avoid NSAIDs. Use alternative analgesic like acetaminophen.',
    },
    {
      med1: 'Metformin',
      med2: 'Gentamicin',
      type: 'Lactic acidosis risk',
      severity: 'severe',
      description: 'Gentamicin may impair renal function, increasing metformin accumulation',
      recommendation: 'Monitor renal function closely. Consider temporary metformin discontinuation.',
    },
    {
      med1: 'Lisinopril',
      med2: 'Ibuprofen',
      type: 'Reduced antihypertensive effect',
      severity: 'moderate',
      description: 'NSAIDs can reduce ACE inhibitor effectiveness and increase renal risk',
      recommendation: 'Use alternative analgesic. Monitor blood pressure.',
    },
    {
      med1: 'Simvastatin',
      med2: 'Omeprazole',
      type: 'Increased statin levels',
      severity: 'moderate',
      description: 'Omeprazole inhibits metabolism of simvastatin',
      recommendation: 'Monitor for myopathy symptoms. Consider dose reduction or alternative statin.',
    },
    {
      med1: 'Amoxicillin',
      med2: 'Warfarin',
      type: 'Increased INR',
      severity: 'moderate',
      description: 'Antibiotics may increase warfarin effect',
      recommendation: 'Monitor INR closely during and after antibiotic course.',
    },
  ]

  console.log('Seeding interactions...')

  for (const interaction of interactions) {
    try {
      const med1Id = medMap[interaction.med1]
      const med2Id = medMap[interaction.med2]

      if (!med1Id || !med2Id) {
        console.log(`⚠ Skipping ${interaction.med1} + ${interaction.med2}: medication not found`)
        continue
      }

      await sql`
        INSERT INTO interactions (medication_id_1, medication_id_2, interaction_type, severity, description, recommendation)
        VALUES (${med1Id}, ${med2Id}, ${interaction.type}, ${interaction.severity}, ${interaction.description}, ${interaction.recommendation})
        ON CONFLICT DO NOTHING
      `
      console.log(`✓ ${interaction.med1} + ${interaction.med2}`)
    } catch (error) {
      console.error(`✗ ${interaction.med1} + ${interaction.med2}:`, error)
    }
  }

  console.log('\n✅ Seeding complete!')
}

seedMedications().catch(console.error)
