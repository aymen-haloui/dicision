import bcryptjs from 'bcryptjs'
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

const sql = postgres(process.env.DATABASE_URL)

const accounts = [
  {
    email: 'admin@hexa.local',
    password: 'Admin@123456',
    fullName: 'HEXA Admin',
    specialization: 'admin',
  },
  {
    email: 'medecin@hexa.local',
    password: 'Medecin@123456',
    fullName: 'Dr Medecin HEXA',
    specialization: 'medecin',
  },
]

async function run() {
  console.log('Seeding user accounts...')

  for (const account of accounts) {
    const passwordHash = await bcryptjs.hash(account.password, 10)

    await sql`
      INSERT INTO users (email, password_hash, full_name, specialization)
      VALUES (${account.email}, ${passwordHash}, ${account.fullName}, ${account.specialization})
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        specialization = EXCLUDED.specialization
    `

    console.log(`  - ${account.email} (${account.specialization}) ready`)
  }

  console.log('\nCredentials:')
  for (const account of accounts) {
    console.log(`  email: ${account.email} | password: ${account.password}`)
  }

  console.log('\nIMPORTANT: change these passwords after first login.')

  console.log('\nSeeding options...')

  const options = [
    // Gender (CDSS spec)
    { category: 'gender', value: 'MALE', label: 'Homme', order: 1 },
    { category: 'gender', value: 'FEMALE', label: 'Femme', order: 2 },
    { category: 'gender', value: 'INTERSEX', label: 'Intersexe', order: 3 },

    // Pregnancy trimester (CDSS spec)
    { category: 'pregnancy_trimester', value: 'FIRST_TRIMESTER', label: '1er trimestre', order: 1 },
    { category: 'pregnancy_trimester', value: 'SECOND_TRIMESTER', label: '2e trimestre', order: 2 },
    { category: 'pregnancy_trimester', value: 'THIRD_TRIMESTER', label: '3e trimestre', order: 3 },

    // Condition category
    { category: 'condition_category', value: 'CARDIOVASCULAR', label: 'Cardiovasculaire', order: 1 },
    { category: 'condition_category', value: 'ENDOCRINE', label: 'Endocrine', order: 2 },
    { category: 'condition_category', value: 'RESPIRATORY', label: 'Respiratoire', order: 3 },
    { category: 'condition_category', value: 'NEUROLOGICAL', label: 'Neurologique', order: 4 },
    { category: 'condition_category', value: 'AUTOIMMUNE', label: 'Autoimmune', order: 5 },
    { category: 'condition_category', value: 'ONCOLOGICAL', label: 'Oncologique', order: 6 },
    { category: 'condition_category', value: 'PSYCHIATRIC', label: 'Psychiatrique', order: 7 },
    { category: 'condition_category', value: 'HEPATIC', label: 'Hépatique', order: 8 },
    { category: 'condition_category', value: 'RENAL', label: 'Rénale', order: 9 },
    { category: 'condition_category', value: 'OTHER', label: 'Autre', order: 10 },

    // Condition status
    { category: 'condition_status', value: 'ACTIVE', label: 'Active', order: 1 },
    { category: 'condition_status', value: 'CONTROLLED', label: 'Contrôlée', order: 2 },
    { category: 'condition_status', value: 'CHRONIC', label: 'Chronique', order: 3 },
    { category: 'condition_status', value: 'RESOLVED', label: 'Résolue', order: 4 },
    { category: 'condition_status', value: 'RECURRENT', label: 'Récurrente', order: 5 },

    // Severity
    { category: 'severity', value: 'MILD', label: 'Légère', order: 1 },
    { category: 'severity', value: 'MODERATE', label: 'Modérée', order: 2 },
    { category: 'severity', value: 'SEVERE', label: 'Sévère', order: 3 },
    { category: 'severity', value: 'CRITICAL', label: 'Critique', order: 4 },

    // Allergen category
    { category: 'allergen_category', value: 'DRUG', label: 'Médicament', order: 1 },
    { category: 'allergen_category', value: 'FOOD', label: 'Alimentaire', order: 2 },
    { category: 'allergen_category', value: 'RESPIRATORY', label: 'Respiratoire', order: 3 },
    { category: 'allergen_category', value: 'CUTANEOUS', label: 'Cutanée', order: 4 },
    { category: 'allergen_category', value: 'INSECT', label: 'Insecte', order: 5 },
    { category: 'allergen_category', value: 'ANIMAL', label: 'Animal', order: 6 },
    { category: 'allergen_category', value: 'PROFESSIONAL', label: 'Professionnel', order: 7 },
    { category: 'allergen_category', value: 'OTHER', label: 'Autre', order: 8 },

    // Reaction type
    { category: 'reaction_type', value: 'RASH', label: 'Éruption cutanée', order: 1 },
    { category: 'reaction_type', value: 'URTICARIA', label: 'Urticaire', order: 2 },
    { category: 'reaction_type', value: 'ANGIOEDEMA', label: 'Angio-œdème', order: 3 },
    { category: 'reaction_type', value: 'ANAPHYLAXIS', label: 'Anaphylaxie', order: 4 },
    { category: 'reaction_type', value: 'DYSPNEA', label: 'Dyspnée', order: 5 },
    { category: 'reaction_type', value: 'VOMITING', label: 'Vomissement', order: 6 },

    // Onset delay
    { category: 'onset_delay', value: 'IMMEDIATE', label: 'Immédiat', order: 1 },
    { category: 'onset_delay', value: '1_HOUR', label: '1 heure', order: 2 },
    { category: 'onset_delay', value: '2_HOURS', label: '2 heures', order: 3 },
    { category: 'onset_delay', value: 'HALF_DAY', label: 'Demi-journée', order: 4 },
    { category: 'onset_delay', value: '1_DAY', label: '1 jour', order: 5 },
    { category: 'onset_delay', value: 'MULTIPLE_DAYS', label: 'Plusieurs jours', order: 6 },

    // Frequency
    { category: 'frequency', value: 'ONCE_DAILY', label: 'Une fois par jour', order: 1 },
    { category: 'frequency', value: 'TWICE_DAILY', label: 'Deux fois par jour', order: 2 },
    { category: 'frequency', value: 'EVERY_8_HOURS', label: 'Toutes les 8 heures', order: 3 },
    { category: 'frequency', value: 'AS_NEEDED', label: 'Au besoin', order: 4 },

    // Route
    { category: 'route', value: 'ORAL', label: 'Oral', order: 1 },
    { category: 'route', value: 'IV', label: 'Intraveineux', order: 2 },
    { category: 'route', value: 'IM', label: 'Intramusculaire', order: 3 },
    { category: 'route', value: 'SC', label: 'Sous-cutané', order: 4 },
    { category: 'route', value: 'INHALATION', label: 'Inhalation', order: 5 },
    { category: 'route', value: 'TOPICAL', label: 'Topique', order: 6 },
    { category: 'route', value: 'RECTAL', label: 'Rectal', order: 7 },
    { category: 'route', value: 'SUBLINGUAL', label: 'Sublingual', order: 8 },

    // Smoking status
    { category: 'smoking_status', value: 'NEVER', label: 'Jamais', order: 1 },
    { category: 'smoking_status', value: 'ACTIVE', label: 'Actif', order: 2 },
    { category: 'smoking_status', value: 'FORMER', label: 'Ancien', order: 3 },
    { category: 'smoking_status', value: 'PASSIVE_EXPOSURE', label: 'Exposition passive', order: 4 },

    // Alcohol use
    { category: 'alcohol_use', value: 'NONE', label: 'Aucun', order: 1 },
    { category: 'alcohol_use', value: 'OCCASIONAL', label: 'Occasionnel', order: 2 },
    { category: 'alcohol_use', value: 'REGULAR', label: 'Régulier', order: 3 },
    { category: 'alcohol_use', value: 'HEAVY', label: 'Abusif', order: 4 },
    { category: 'alcohol_use', value: 'FORMER', label: 'Ancien', order: 5 },

    // Physical activity
    { category: 'physical_activity', value: 'NONE', label: 'Aucune', order: 1 },
    { category: 'physical_activity', value: 'LOW', label: 'Faible', order: 2 },
    { category: 'physical_activity', value: 'MODERATE', label: 'Modérée', order: 3 },
    { category: 'physical_activity', value: 'HIGH', label: 'Élevée', order: 4 },
    { category: 'physical_activity', value: 'ATHLETE', label: 'Athlète', order: 5 },

    // Stress level
    { category: 'stress_level', value: 'LOW', label: 'Faible', order: 1 },
    { category: 'stress_level', value: 'MODERATE', label: 'Modéré', order: 2 },
    { category: 'stress_level', value: 'HIGH', label: 'Élevé', order: 3 },
    { category: 'stress_level', value: 'EXTREME', label: 'Extrême', order: 4 },

    // Sleep quality
    { category: 'sleep_quality', value: 'GOOD', label: 'Bonne', order: 1 },
    { category: 'sleep_quality', value: 'AVERAGE', label: 'Moyenne', order: 2 },
    { category: 'sleep_quality', value: 'POOR', label: 'Mauvaise', order: 3 },
    { category: 'sleep_quality', value: 'SEVERE_INSOMNIA', label: 'Insomnie sévère', order: 4 },

    // Breastfeeding type
    { category: 'breastfeeding_type', value: 'EXCLUSIVE', label: 'Exclusif', order: 1 },
    { category: 'breastfeeding_type', value: 'MIXED', label: 'Mixte', order: 2 },
    { category: 'breastfeeding_type', value: 'FORMULA', label: 'Artificialisé', order: 3 },
    { category: 'breastfeeding_type', value: 'UNKNOWN', label: 'Inconnu', order: 4 },

    // Fever status
    { category: 'fever_status', value: 'NONE', label: 'Aucun', order: 1 },
    { category: 'fever_status', value: 'FEVERISH', label: 'Sensation de fièvre', order: 2 },
    { category: 'fever_status', value: 'CONFIRMED', label: 'Fièvre mesurée', order: 3 },
    { category: 'fever_status', value: 'UNKNOWN', label: 'Inconnu', order: 4 },

    // Respiratory status
    { category: 'respiratory_status', value: 'NORMAL', label: 'Normale', order: 1 },
    { category: 'respiratory_status', value: 'DIFFICULT', label: 'Difficile', order: 2 },
    { category: 'respiratory_status', value: 'RAPID', label: 'Rapide', order: 3 },
    { category: 'respiratory_status', value: 'UNKNOWN', label: 'Inconnue', order: 4 },

    // Consciousness state
    { category: 'consciousness_state', value: 'NORMAL', label: 'Normal', order: 1 },
    { category: 'consciousness_state', value: 'CONFUSION', label: 'Confusion', order: 2 },
    { category: 'consciousness_state', value: 'UNCONSCIOUS', label: 'Perte de connaissance', order: 3 },
    { category: 'consciousness_state', value: 'UNKNOWN', label: 'Inconnu', order: 4 },

    // Diabetes type
    { category: 'diabetes_type', value: 'TYPE1', label: 'Type 1', order: 1 },
    { category: 'diabetes_type', value: 'TYPE2', label: 'Type 2', order: 2 },
    { category: 'diabetes_type', value: 'UNKNOWN', label: 'Non précisé', order: 3 },

    // Condition type
    { category: 'condition_type', value: 'CANCER', label: 'Cancer', order: 1 },
    { category: 'condition_type', value: 'IMMUNOSUPPRESSION', label: 'Immunosuppression', order: 2 },
    { category: 'condition_type', value: 'TRANSPLANT', label: 'Transplantation', order: 3 },
    { category: 'condition_type', value: 'AUTOIMMUNE_SEVERE', label: 'Autoimmune sévère', order: 4 },
    { category: 'condition_type', value: 'GENETIC_DISORDER', label: 'Trouble génétique', order: 5 },

    // Treatment type
    { category: 'treatment_type', value: 'SURGERY', label: 'Chirurgie', order: 1 },
    { category: 'treatment_type', value: 'CHEMOTHERAPY', label: 'Chimiothérapie', order: 2 },
    { category: 'treatment_type', value: 'RADIOTHERAPY', label: 'Radiothérapie', order: 3 },
    { category: 'treatment_type', value: 'IMMUNOTHERAPY', label: 'Immunothérapie', order: 4 },
    { category: 'treatment_type', value: 'HORMONOTHERAPY', label: 'Hormonothérapie', order: 5 },
    { category: 'treatment_type', value: 'STEM_CELL_TRANSPLANT', label: 'Greffe de cellules souches', order: 6 },
    { category: 'treatment_type', value: 'TARGETED_THERAPY', label: 'Thérapie ciblée', order: 7 },
    { category: 'treatment_type', value: 'GENE_CELL_THERAPY', label: 'Thérapie génique et cellulaire', order: 8 },
    { category: 'treatment_type', value: 'PALLIATIVE_SUPPORTIVE_CARE', label: 'Soins palliatifs / support', order: 9 },
    { category: 'treatment_type', value: 'STEREOTACTIC_RADIOSURGERY', label: 'Radiochirurgie stéréotaxique', order: 10 },
    { category: 'treatment_type', value: 'BRACHYTHERAPY', label: 'Curiethérapie', order: 11 },
    { category: 'treatment_type', value: 'PROTON_THERAPY', label: 'Protonthérapie', order: 12 },
    { category: 'treatment_type', value: 'CRYOTHERAPY', label: 'Cryothérapie', order: 13 },
    { category: 'treatment_type', value: 'HYPERTHERMIA', label: 'Thermothérapie / hyperthermie', order: 14 },
    { category: 'treatment_type', value: 'PHOTODYNAMIC_THERAPY', label: 'Photothérapie dynamique', order: 15 },
    { category: 'treatment_type', value: 'RADIOFREQUENCY_ABLATION', label: 'Ablation par radiofréquence', order: 16 },
    { category: 'treatment_type', value: 'TUMOR_EMBOLIZATION', label: 'Embolisation / chimioembolisation', order: 17 },
    { category: 'treatment_type', value: 'ONCOLOGIC_LASER_THERAPY', label: 'Laserthérapie oncologique', order: 18 },
    { category: 'treatment_type', value: 'ACTIVE_SURVEILLANCE', label: 'Surveillance active', order: 19 },
    { category: 'treatment_type', value: 'COMBINED_THERAPIES', label: 'Thérapies combinées', order: 20 },

  ]

  for (const option of options) {
    await sql`
      INSERT INTO "Option" (category, value, label, "order")
      VALUES (${option.category}, ${option.value}, ${option.label}, ${option.order})
      ON CONFLICT (category, value) DO UPDATE SET
        label = EXCLUDED.label,
        "order" = EXCLUDED."order"
    `
    console.log(`  - ${option.category}: ${option.label}`)
  }

  console.log('\nSeeding completed successfully!')
}

run()
  .catch((error) => {
    console.error('Failed to seed:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end()
  })
