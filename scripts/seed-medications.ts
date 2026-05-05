import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function seedMedications() {
  const medications = [
    // ── Ibuprofène ──────────────────────────────────────────────────────────
    {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      category: 'NSAID',
      dosageForm: 'Tablet',
      defaultDosage: '400mg',
      warnings: 'GI bleeding risk, renal toxicity, cardiovascular risk. Avoid in late pregnancy.',
      maxDailyDoseAdult: 3200,
      maxDailyDoseChild: 40, // mg/kg/day (approx)
      contraindications: [
        { condition: 'renal_insufficiency',   severity: 'absolute', description: 'Contraindicated in severe renal insufficiency — can cause acute renal failure', threshold: 30 },
        { condition: 'hepatic_insufficiency', severity: 'absolute', description: 'Contraindicated in severe hepatic insufficiency' },
        { condition: 'cardiac_insufficiency', severity: 'absolute', description: 'Contraindicated in severe cardiac insufficiency' },
        { condition: 'pregnancy_trimester_3', severity: 'absolute', description: 'Contraindicated ≥ 6 months pregnancy — premature closure of ductus arteriosus' },
        { condition: 'age_under_6',           severity: 'absolute', description: 'Contraindicated in children < 6 years old' },
      ],
      toxicityThresholds: {
        child_toxic_dose_per_kg: 100,   // mg/kg — unlikely toxic below this
        child_severe_dose_per_kg: 400,  // mg/kg — potentially fatal
      },
      overdoseManagement: 'Light: activated charcoal if < 1-2h post-ingestion. Moderate: IV hydration. Severe: ICU, mechanical ventilation, vasopressors, benzodiazepines for seizures. Renal failure: CRRT / hemodialysis.',
      pharmacologicalData: {
        class: 'NSAID',
        mechanism: 'Non-selective COX-1 and COX-2 inhibitor',
        half_life_hours: 2,
      },
    },
    // ── Amoxicilline ────────────────────────────────────────────────────────
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      category: 'Antibiotic',
      dosageForm: 'Tablet',
      defaultDosage: '500mg',
      warnings: 'Beta-lactam antibiotic. Allergy cross-reactivity with penicillins and cephalosporins. Monitor INR if co-prescribed with anticoagulants.',
      maxDailyDoseAdult: 3000,
      maxDailyDoseChild: 100, // mg/kg/day max (ENT/respiratory)
      contraindications: [
        { condition: 'renal_insufficiency',   severity: 'relative', description: 'Dose adjustment required in renal insufficiency (risk of accumulation)', threshold: 30 },
        { condition: 'hepatic_insufficiency', severity: 'relative', description: 'Use with caution in hepatic insufficiency' },
        { condition: 'epilepsy',              severity: 'relative', description: 'High doses may lower seizure threshold in epileptic patients' },
      ],
      toxicityThresholds: {},
      overdoseManagement: 'Symptomatic treatment. Dialysis can remove amoxicillin. Monitor renal function.',
      pharmacologicalData: {
        class: 'Beta-lactam / Aminopenicillin',
        mechanism: 'Inhibits bacterial cell wall synthesis by binding penicillin-binding proteins',
        spectrum: 'Gram-positive + some Gram-negative',
        half_life_hours: 1.5,
      },
    },
    // ── Metformine ──────────────────────────────────────────────────────────
    {
      name: 'Metformin',
      genericName: 'Metformin hydrochloride',
      category: 'Antidiabetic',
      dosageForm: 'Tablet',
      defaultDosage: '500mg',
      warnings: 'Risk of lactic acidosis (MALA) — potentially fatal. Absolutely contraindicated in severe renal, hepatic, or cardiac insufficiency, alcoholism, and shock states. Stop before surgery / iodinated contrast injection.',
      maxDailyDoseAdult: 3000,
      maxDailyDoseChild: 2000,
      contraindications: [
        { condition: 'renal_insufficiency',   severity: 'absolute', description: 'Absolutely contraindicated: CrCl < 30 ml/min — fatal lactic acidosis risk', threshold: 30 },
        { condition: 'hepatic_insufficiency', severity: 'absolute', description: 'Absolutely contraindicated in hepatic insufficiency — impairs lactate clearance' },
        { condition: 'cardiac_insufficiency', severity: 'absolute', description: 'Absolutely contraindicated in cardiac insufficiency — tissue hypoxia triggers lactic acidosis' },
        { condition: 'alcoholism',            severity: 'absolute', description: 'Absolutely contraindicated — alcohol potentiates lactic acidosis risk' },
      ],
      toxicityThresholds: {},
      overdoseManagement: 'Lactic acidosis (MALA) is most severe manifestation. Appears within 6h of acute overdose. Treatment: stop metformin, bicarbonate therapy for acidosis, hemodialysis to remove metformin and correct acidosis. ICU admission if severe.',
      pharmacologicalData: {
        class: 'Biguanide',
        mechanism: 'Decreases hepatic glucose production, improves insulin sensitivity, reduces intestinal glucose absorption',
        half_life_hours: 5,
      },
    },
    {
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      category: 'Antihypertensive',
      dosageForm: 'Tablet',
      defaultDosage: '10mg',
      warnings: 'May cause hyperkalemia. Monitor potassium levels.',
      maxDailyDoseAdult: 40,
      maxDailyDoseChild: null,
      contraindications: [],
      toxicityThresholds: {},
      overdoseManagement: 'Supportive. IV fluids for hypotension.',
      pharmacologicalData: { class: 'ACE Inhibitor' },
    },
    {
      name: 'Warfarin',
      genericName: 'Warfarin',
      category: 'Anticoagulant',
      dosageForm: 'Tablet',
      defaultDosage: '2-10mg',
      warnings: 'Monitor INR regularly. High risk of bleeding interactions. Many drug-drug interactions.',
      maxDailyDoseAdult: 10,
      maxDailyDoseChild: null,
      contraindications: [],
      toxicityThresholds: {},
      overdoseManagement: 'Vitamin K1 (phytomenadione) IV/oral. Fresh frozen plasma or PCC for major bleeding.',
      pharmacologicalData: { class: 'Vitamin K antagonist' },
    },
    {
      name: 'Aspirin',
      genericName: 'Acetylsalicylic acid',
      category: 'Analgesic / Antiplatelet',
      dosageForm: 'Tablet',
      defaultDosage: '325-500mg',
      warnings: 'Increased bleeding risk with anticoagulants. Avoid in children with viral illness (Reye syndrome).',
      maxDailyDoseAdult: 4000,
      maxDailyDoseChild: null,
      contraindications: [],
      toxicityThresholds: {},
      overdoseManagement: 'Activated charcoal if early. Alkaline diuresis. Dialysis in severe cases.',
      pharmacologicalData: { class: 'Salicylate / NSAID' },
    },
    {
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      category: 'Proton pump inhibitor',
      dosageForm: 'Capsule',
      defaultDosage: '20mg',
      warnings: 'May reduce absorption of other drugs. Monitor drug interactions.',
      maxDailyDoseAdult: 40,
      maxDailyDoseChild: null,
      contraindications: [],
      toxicityThresholds: {},
      overdoseManagement: 'Symptomatic treatment.',
      pharmacologicalData: { class: 'PPI' },
    },
    {
      name: 'Gentamicin',
      genericName: 'Gentamicin sulfate',
      category: 'Antibiotic',
      dosageForm: 'Injection',
      defaultDosage: '3-5mg/kg',
      warnings: 'Nephrotoxic and ototoxic, especially in renal impairment. Monitor drug levels.',
      maxDailyDoseAdult: 360,
      maxDailyDoseChild: null,
      contraindications: [
        { condition: 'renal_insufficiency', severity: 'relative', description: 'Dose adjustment required — risk of nephrotoxicity and ototoxicity', threshold: 60 },
      ],
      toxicityThresholds: {},
      overdoseManagement: 'Supportive. Hemodialysis for severe cases.',
      pharmacologicalData: { class: 'Aminoglycoside' },
    },
    {
      name: 'Vancomycin',
      genericName: 'Vancomycin',
      category: 'Antibiotic',
      dosageForm: 'Injection',
      defaultDosage: '15-20mg/kg',
      warnings: 'Monitor renal function and vancomycin trough levels. Red man syndrome with rapid infusion.',
      maxDailyDoseAdult: 4000,
      maxDailyDoseChild: null,
      contraindications: [
        { condition: 'renal_insufficiency', severity: 'relative', description: 'Extended interval dosing required in renal impairment', threshold: 30 },
      ],
      toxicityThresholds: {},
      overdoseManagement: 'Supportive. Hemodialysis with high-flux membranes.',
      pharmacologicalData: { class: 'Glycopeptide antibiotic' },
    },
    {
      name: 'Simvastatin',
      genericName: 'Simvastatin',
      category: 'Statin',
      dosageForm: 'Tablet',
      defaultDosage: '10-40mg',
      warnings: 'Risk of myopathy / rhabdomyolysis with CYP3A4 inhibitors.',
      maxDailyDoseAdult: 40,
      maxDailyDoseChild: null,
      contraindications: [],
      toxicityThresholds: {},
      overdoseManagement: 'Symptomatic.',
      pharmacologicalData: { class: 'HMG-CoA reductase inhibitor' },
    },
  ]

  console.log('Seeding medications...')

  for (const med of medications) {
    try {
      await sql`
        INSERT INTO medications (
          name, generic_name, category, dosage_form, default_dosage, warnings,
          max_daily_dose_adult, max_daily_dose_child,
          contraindications, toxicity_thresholds, overdose_management, pharmacological_data
        )
        VALUES (
          ${med.name}, ${med.genericName}, ${med.category}, ${med.dosageForm}, ${med.defaultDosage}, ${med.warnings},
          ${med.maxDailyDoseAdult ?? null}, ${med.maxDailyDoseChild ?? null},
          ${JSON.stringify(med.contraindications ?? [])}, ${JSON.stringify(med.toxicityThresholds ?? {})},
          ${med.overdoseManagement ?? null}, ${JSON.stringify(med.pharmacologicalData ?? {})}
        )
        ON CONFLICT (name) DO UPDATE SET
          warnings = EXCLUDED.warnings,
          max_daily_dose_adult = EXCLUDED.max_daily_dose_adult,
          max_daily_dose_child = EXCLUDED.max_daily_dose_child,
          contraindications = EXCLUDED.contraindications,
          toxicity_thresholds = EXCLUDED.toxicity_thresholds,
          overdose_management = EXCLUDED.overdose_management,
          pharmacological_data = EXCLUDED.pharmacological_data
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

  // Create interactions — from pharmacological docs
  const interactions = [
    // ── Ibuprofène interactions ──────────────────────────────────────────
    { med1: 'Warfarin',     med2: 'Ibuprofen',   type: 'Hemorrhage risk',          severity: 'severe',   description: 'NSAIDs potentiate anticoagulant effect of warfarin — severe hemorrhage risk', recommendation: 'Avoid NSAIDs. Use paracetamol. If unavoidable: strict INR monitoring.' },
    { med1: 'Aspirin',      med2: 'Ibuprofen',   type: 'Additive NSAID toxicity',  severity: 'moderate', description: 'Combination of NSAIDs increases GI bleeding and renal toxicity', recommendation: 'Avoid combination. Use only one NSAID at a time.' },
    { med1: 'Ibuprofen',    med2: 'Metformin',   type: 'Renal risk + lactic acidosis', severity: 'moderate', description: 'Ibuprofen can reduce renal perfusion, increasing metformin accumulation and lactic acidosis risk', recommendation: 'Monitor renal function. Consider temporary metformin suspension.' },

    // ── Amoxicilline interactions ────────────────────────────────────────
    { med1: 'Amoxicillin',  med2: 'Warfarin',    type: 'Increased INR / hemorrhage',severity: 'severe',   description: 'Amoxicillin raises INR in patients on anticoagulants (warfarin, acenocoumarol) — hemorrhage risk', recommendation: 'Monitor INR closely during and after antibiotic course. Adjust AVK dose if needed.' },
    { med1: 'Aspirin',      med2: 'Warfarin',    type: 'Hemorrhage risk',          severity: 'critical', description: 'Aspirin potentiates anticoagulant effect of warfarin — critical hemorrhage risk', recommendation: 'Avoid combination. If necessary monitor INR and use lowest aspirin dose.' },

    // ── Metformine interactions ──────────────────────────────────────────
    { med1: 'Metformin',    med2: 'Gentamicin',  type: 'Lactic acidosis risk',     severity: 'severe',   description: 'Gentamicin-induced nephrotoxicity increases metformin accumulation → lactic acidosis', recommendation: 'Monitor renal function. Suspend metformin if renal function deteriorates.' },
    { med1: 'Metformin',    med2: 'Vancomycin',  type: 'Lactic acidosis risk',     severity: 'moderate', description: 'Vancomycin nephrotoxicity can increase metformin accumulation risk', recommendation: 'Monitor renal function and metformin levels.' },

    // ── General ─────────────────────────────────────────────────────────
    { med1: 'Lisinopril',   med2: 'Ibuprofen',   type: 'Reduced antihypertensive effect', severity: 'moderate', description: 'NSAIDs reduce ACE inhibitor effectiveness and increase renal toxicity risk', recommendation: 'Use alternative analgesic (paracetamol). Monitor blood pressure and renal function.' },
    { med1: 'Simvastatin',  med2: 'Omeprazole',  type: 'Increased statin exposure', severity: 'moderate', description: 'Omeprazole inhibits CYP2C19, modestly increasing simvastatin levels', recommendation: 'Monitor for myopathy symptoms. Consider switching to pantoprazole.' },
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
