// Plain JS seed — run with: node scripts/run-seed.mjs
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

const medications = [
  {
    name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'NSAID', dosageForm: 'Tablet', defaultDosage: '400mg',
    warnings: 'GI bleeding risk, renal toxicity, cardiovascular risk. Avoid in late pregnancy.',
    maxDailyDoseAdult: 3200, maxDailyDoseChild: 40,
    contraindications: [
      { condition: 'renal_insufficiency',   severity: 'absolute', description: 'Contraindicated in severe renal insufficiency', threshold: 30 },
      { condition: 'hepatic_insufficiency', severity: 'absolute', description: 'Contraindicated in severe hepatic insufficiency' },
      { condition: 'cardiac_insufficiency', severity: 'absolute', description: 'Contraindicated in severe cardiac insufficiency' },
      { condition: 'pregnancy_trimester_3', severity: 'absolute', description: 'Contraindicated ≥ 6 months pregnancy' },
      { condition: 'age_under_6',           severity: 'absolute', description: 'Contraindicated in children < 6 years old' },
    ],
    toxicityThresholds: { child_toxic_dose_per_kg: 100, child_severe_dose_per_kg: 400 },
    overdoseManagement: 'Light: activated charcoal if < 1-2h. Moderate: IV hydration. Severe: ICU, ventilation, vasopressors, benzodiazepines. Renal failure: CRRT/hemodialysis.',
    pharmacologicalData: { class: 'NSAID', mechanism: 'Non-selective COX-1 and COX-2 inhibitor', half_life_hours: 2 },
  },
  {
    name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Antibiotic', dosageForm: 'Tablet', defaultDosage: '500mg',
    warnings: 'Beta-lactam. Allergy cross-reactivity with penicillins/cephalosporins. Monitor INR with anticoagulants.',
    maxDailyDoseAdult: 3000, maxDailyDoseChild: 100,
    contraindications: [
      { condition: 'renal_insufficiency', severity: 'relative', description: 'Dose adjustment required in renal insufficiency', threshold: 30 },
      { condition: 'hepatic_insufficiency', severity: 'relative', description: 'Use with caution in hepatic insufficiency' },
      { condition: 'epilepsy', severity: 'relative', description: 'High doses may lower seizure threshold' },
    ],
    toxicityThresholds: {},
    overdoseManagement: 'Symptomatic. Dialysis can remove amoxicillin. Monitor renal function.',
    pharmacologicalData: { class: 'Beta-lactam / Aminopenicillin', half_life_hours: 1.5 },
  },
  {
    name: 'Metformin', genericName: 'Metformin hydrochloride', category: 'Antidiabetic', dosageForm: 'Tablet', defaultDosage: '500mg',
    warnings: 'Risk of fatal lactic acidosis (MALA). Absolutely contraindicated in severe renal, hepatic, cardiac insufficiency, alcoholism, shock.',
    maxDailyDoseAdult: 3000, maxDailyDoseChild: 2000,
    contraindications: [
      { condition: 'renal_insufficiency',   severity: 'absolute', description: 'Absolutely contraindicated: CrCl < 30 ml/min — fatal lactic acidosis', threshold: 30 },
      { condition: 'hepatic_insufficiency', severity: 'absolute', description: 'Absolutely contraindicated in hepatic insufficiency' },
      { condition: 'cardiac_insufficiency', severity: 'absolute', description: 'Absolutely contraindicated in cardiac insufficiency' },
      { condition: 'alcoholism',            severity: 'absolute', description: 'Absolutely contraindicated — potentiates lactic acidosis' },
    ],
    toxicityThresholds: {},
    overdoseManagement: 'Lactic acidosis (MALA): stop metformin, bicarbonate therapy, hemodialysis. ICU if severe.',
    pharmacologicalData: { class: 'Biguanide', half_life_hours: 5 },
  },
  {
    name: 'Lisinopril', genericName: 'Lisinopril', category: 'Antihypertensive', dosageForm: 'Tablet', defaultDosage: '10mg',
    warnings: 'Hyperkalemia risk. Monitor potassium. Angioedema risk.',
    maxDailyDoseAdult: 40, maxDailyDoseChild: null, contraindications: [], toxicityThresholds: {},
    overdoseManagement: 'Supportive. IV fluids for hypotension.',
    pharmacologicalData: { class: 'ACE Inhibitor' },
  },
  {
    name: 'Warfarin', genericName: 'Warfarin', category: 'Anticoagulant', dosageForm: 'Tablet', defaultDosage: '2-10mg',
    warnings: 'Narrow therapeutic index. Monitor INR. Many drug-drug interactions.',
    maxDailyDoseAdult: 10, maxDailyDoseChild: null, contraindications: [], toxicityThresholds: {},
    overdoseManagement: 'Vitamin K1 IV/oral. FFP or PCC for major bleeding.',
    pharmacologicalData: { class: 'Vitamin K antagonist' },
  },
  {
    name: 'Aspirin', genericName: 'Acetylsalicylic acid', category: 'Analgesic / Antiplatelet', dosageForm: 'Tablet', defaultDosage: '500mg',
    warnings: 'Bleeding risk with anticoagulants. Avoid in children with viral illness (Reye).',
    maxDailyDoseAdult: 4000, maxDailyDoseChild: null, contraindications: [], toxicityThresholds: {},
    overdoseManagement: 'Activated charcoal if early. Alkaline diuresis. Dialysis in severe cases.',
    pharmacologicalData: { class: 'Salicylate / NSAID' },
  },
  {
    name: 'Omeprazole', genericName: 'Omeprazole', category: 'PPI', dosageForm: 'Capsule', defaultDosage: '20mg',
    warnings: 'May reduce absorption of some drugs.', maxDailyDoseAdult: 40, maxDailyDoseChild: null,
    contraindications: [], toxicityThresholds: {}, overdoseManagement: 'Symptomatic.',
    pharmacologicalData: { class: 'PPI' },
  },
  {
    name: 'Gentamicin', genericName: 'Gentamicin sulfate', category: 'Antibiotic', dosageForm: 'Injection', defaultDosage: '3-5mg/kg',
    warnings: 'Nephrotoxic and ototoxic. Monitor drug levels and renal function.',
    maxDailyDoseAdult: 360, maxDailyDoseChild: null,
    contraindications: [{ condition: 'renal_insufficiency', severity: 'relative', description: 'Nephrotoxic — dose adjustment required', threshold: 60 }],
    toxicityThresholds: {}, overdoseManagement: 'Supportive. Hemodialysis.',
    pharmacologicalData: { class: 'Aminoglycoside' },
  },
  {
    name: 'Vancomycin', genericName: 'Vancomycin', category: 'Antibiotic', dosageForm: 'Injection', defaultDosage: '15-20mg/kg',
    warnings: 'Monitor trough levels and renal function. Red man syndrome with rapid infusion.',
    maxDailyDoseAdult: 4000, maxDailyDoseChild: null,
    contraindications: [{ condition: 'renal_insufficiency', severity: 'relative', description: 'Extended interval dosing required', threshold: 30 }],
    toxicityThresholds: {}, overdoseManagement: 'Supportive. High-flux hemodialysis.',
    pharmacologicalData: { class: 'Glycopeptide antibiotic' },
  },
  {
    name: 'Simvastatin', genericName: 'Simvastatin', category: 'Statin', dosageForm: 'Tablet', defaultDosage: '20mg',
    warnings: 'Myopathy/rhabdomyolysis with CYP3A4 inhibitors.',
    maxDailyDoseAdult: 40, maxDailyDoseChild: null, contraindications: [], toxicityThresholds: {},
    overdoseManagement: 'Symptomatic.', pharmacologicalData: { class: 'HMG-CoA reductase inhibitor' },
  },
]

const interactionRules = [
  { med1: 'Warfarin',    med2: 'Ibuprofen',   type: 'Hemorrhage risk',          sev: 'severe',   desc: 'NSAIDs potentiate anticoagulant effect — severe hemorrhage risk', rec: 'Avoid NSAIDs. Use paracetamol. Monitor INR if unavoidable.' },
  { med1: 'Warfarin',    med2: 'Aspirin',      type: 'Hemorrhage risk',          sev: 'critical', desc: 'Aspirin + warfarin — critical hemorrhage risk', rec: 'Avoid. If necessary: lowest aspirin dose, strict INR monitoring.' },
  { med1: 'Aspirin',     med2: 'Ibuprofen',    type: 'Additive NSAID toxicity',  sev: 'moderate', desc: 'Combination of NSAIDs increases GI bleeding and renal toxicity', rec: 'Avoid. Use only one NSAID at a time.' },
  { med1: 'Amoxicillin', med2: 'Warfarin',     type: 'Increased INR',            sev: 'severe',   desc: 'Amoxicillin raises INR — hemorrhage risk in patients on anticoagulants', rec: 'Monitor INR closely during and after antibiotic course. Adjust AVK dose.' },
  { med1: 'Ibuprofen',   med2: 'Metformin',    type: 'Lactic acidosis risk',     sev: 'moderate', desc: 'Ibuprofen reduces renal perfusion, increasing metformin accumulation risk', rec: 'Monitor renal function. Consider temporary metformin suspension.' },
  { med1: 'Metformin',   med2: 'Gentamicin',   type: 'Lactic acidosis risk',     sev: 'severe',   desc: 'Gentamicin nephrotoxicity increases metformin accumulation → lactic acidosis', rec: 'Monitor renal function. Suspend metformin if function deteriorates.' },
  { med1: 'Lisinopril',  med2: 'Ibuprofen',    type: 'Reduced antihypertensive', sev: 'moderate', desc: 'NSAIDs reduce ACE inhibitor effectiveness and increase renal toxicity', rec: 'Use paracetamol. Monitor BP and renal function.' },
]

async function run() {
  console.log('Seeding medications...')
  for (const med of medications) {
    try {
      await sql`
        INSERT INTO medications (
          name, generic_name, category, dosage_form, default_dosage, warnings,
          max_daily_dose_adult, max_daily_dose_child,
          contraindications, toxicity_thresholds, overdose_management, pharmacological_data
        ) VALUES (
          ${med.name}, ${med.genericName}, ${med.category}, ${med.dosageForm}, ${med.defaultDosage}, ${med.warnings},
          ${med.maxDailyDoseAdult ?? null}, ${med.maxDailyDoseChild ?? null},
          ${JSON.stringify(med.contraindications)}, ${JSON.stringify(med.toxicityThresholds)},
          ${med.overdoseManagement}, ${JSON.stringify(med.pharmacologicalData)}
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
      console.log(`  ✓ ${med.name}`)
    } catch(e) { console.error(`  ✗ ${med.name}:`, e.message) }
  }

  const rows = await sql`SELECT id, name FROM medications`
  const map = {}
  rows.forEach(r => { map[r.name] = r.id })

  console.log('\nSeeding interaction rules...')
  for (const r of interactionRules) {
    const id1 = map[r.med1], id2 = map[r.med2]
    if (!id1 || !id2) { console.log(`  ⚠ Skip: ${r.med1}+${r.med2} — not found`); continue }
    try {
      await sql`
        INSERT INTO interactions (medication_id_1, medication_id_2, interaction_type, severity, description, recommendation)
        VALUES (${id1}, ${id2}, ${r.type}, ${r.sev}, ${r.desc}, ${r.rec})
        ON CONFLICT DO NOTHING
      `
      console.log(`  ✓ ${r.med1} + ${r.med2} (${r.sev})`)
    } catch(e) { console.error(`  ✗ ${r.med1}+${r.med2}:`, e.message) }
  }

  console.log('\n✅ Seed complete')
  await sql.end()
}

run().catch(e => { console.error(e); process.exit(1) })
