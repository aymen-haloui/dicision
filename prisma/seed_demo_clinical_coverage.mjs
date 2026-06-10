import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPaths = [resolve(__dirname, '../.env'), resolve(__dirname, '../.env.local')]

for (const envPath of envPaths) {
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
}

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const requiresSsl = process.env.DB_SSL === 'true' || connectionString.includes('.neon.tech') || /sslmode=require/i.test(connectionString)
const sql = postgres(connectionString, { ssl: requiresSsl })

const DEMO_TAG = 'clinical-demo'

const medications = [
  {
    name: 'Ibuprofène',
    generic_name: 'ibuprofen',
    category: 'NSAID',
    dosage_form: 'comprimé / suspension',
    default_dosage: '200-400 mg par prise',
    warnings: 'Éviter en insuffisance rénale sévère, ulcère actif, grossesse tardive et association non surveillée avec anticoagulants.',
    contraindications: ['Insuffisance rénale sévère', 'Ulcère peptique actif', 'Grossesse au 3e trimestre'],
    max_daily_dose_adult: 2400,
    max_daily_dose_child: 30,
    toxicity_thresholds: { adult_toxic_dose: 3200, child_toxic_dose_per_kg: 30 },
    overdose_management: 'Arrêt du traitement, hydratation, surveillance rénale et digestive.',
    pharmacological_data: { mechanism: 'Inhibiteur non sélectif de COX', half_life_hours: 2, onset_minutes: 30 },
  },
  {
    name: 'Warfarine',
    generic_name: 'warfarin',
    category: 'Anticoagulant',
    dosage_form: 'comprimé',
    default_dosage: 'selon INR',
    warnings: 'Risque hémorragique élevé avec AINS, nombreux médicaments et variations alimentaires.',
    contraindications: ['Saignement actif', 'Grossesse', 'Surveillance INR impossible'],
    max_daily_dose_adult: 15,
    max_daily_dose_child: 0.5,
    toxicity_thresholds: { adult_toxic_dose: 10 },
    overdose_management: 'Évaluer INR, vitamine K selon gravité, surveillance du saignement.',
    pharmacological_data: { mechanism: 'Antagoniste de la vitamine K' },
  },
  {
    name: 'Énalapril',
    generic_name: 'enalapril',
    category: 'ACE_INHIBITOR',
    dosage_form: 'comprimé',
    default_dosage: '5-20 mg/j',
    warnings: 'Surveillance tensionnelle et rénale, prudence avec diurétiques et AINS.',
    contraindications: ['Grossesse', 'Antécédent d\'angiœdème', 'Sténose bilatérale des artères rénales'],
    max_daily_dose_adult: 40,
    max_daily_dose_child: 0.5,
    toxicity_thresholds: { adult_toxic_dose: 60 },
    overdose_management: 'Surveillance tensionnelle, remplissage si hypotension, avis spécialisé si IRA.',
    pharmacological_data: { mechanism: 'Inhibiteur de l\'enzyme de conversion' },
  },
  {
    name: 'Furosémide',
    generic_name: 'furosemide',
    category: 'Loop_diuretic',
    dosage_form: 'comprimé / injectable',
    default_dosage: '20-80 mg/j',
    warnings: 'Peut déshydrater, provoquer hypokaliémie et majorer les troubles rénaux.',
    contraindications: ['Anurie', 'Déshydratation sévère', 'Hypovolémie non corrigée'],
    max_daily_dose_adult: 600,
    max_daily_dose_child: 6,
    toxicity_thresholds: { adult_toxic_dose: 800 },
    overdose_management: 'Corriger l\'hypovolémie, surveiller électrolytes et fonction rénale.',
    pharmacological_data: { mechanism: 'Diurétique de l\'anse' },
  },
  {
    name: 'Metformine',
    generic_name: 'metformin',
    category: 'Antidiabetic',
    dosage_form: 'comprimé',
    default_dosage: '500-1000 mg 2 à 3 fois/j',
    warnings: 'Adapter à la fonction rénale; prudence en hypoxie, sepsis et jeûne prolongé.',
    contraindications: ['DFG < 30 mL/min', 'Acidose métabolique', 'Hypoxie sévère'],
    max_daily_dose_adult: 2550,
    max_daily_dose_child: 2000,
    toxicity_thresholds: { adult_toxic_dose: 3000 },
    overdose_management: 'Surveillance lactates, arrêt temporaire si contexte hypoxique ou rénal.',
    pharmacological_data: { mechanism: 'Biguanide, diminution de la néoglucogenèse hépatique' },
  },
  {
    name: 'Paracétamol',
    generic_name: 'acetaminophen',
    category: 'Analgesic',
    dosage_form: 'comprimé / sirop / injectable',
    default_dosage: '500-1000 mg par prise',
    warnings: 'Risque hépatotoxique en surdosage ou en contexte d\'alcoolisme chronique.',
    contraindications: ['Insuffisance hépatique sévère non surveillée', 'Surdosage cumulatif'],
    max_daily_dose_adult: 3000,
    max_daily_dose_child: 60,
    toxicity_thresholds: { adult_toxic_dose: 4000, child_toxic_dose_per_kg: 75, child_severe_dose_per_kg: 150 },
    overdose_management: 'N-acétylcystéine selon délai et dose cumulée, surveillance hépatique.',
    pharmacological_data: { mechanism: 'Antalgique et antipyrétique central' },
  },
  {
    name: 'Amoxicilline',
    generic_name: 'amoxicillin',
    category: 'Antibiotic',
    dosage_form: 'comprimé / suspension',
    default_dosage: '250-1000 mg par prise',
    warnings: 'Allergie aux bêta-lactamines, adaptation si insuffisance rénale sévère.',
    contraindications: ['Allergie à la pénicilline', 'Réaction anaphylactique antérieure'],
    max_daily_dose_adult: 3000,
    max_daily_dose_child: 90,
    toxicity_thresholds: { adult_toxic_dose: 4500 },
    overdose_management: 'Surveillance digestive et allergique, adaptation rénale.',
    pharmacological_data: { mechanism: 'Bêta-lactamine bactéricide' },
  },
  {
    name: 'Salbutamol',
    generic_name: 'salbutamol',
    category: 'Bronchodilator',
    dosage_form: 'inhalateur / nébulisation',
    default_dosage: 'selon crise',
    warnings: 'Tachycardie possible, surveillance si usage répété ou crise sévère.',
    contraindications: ['Tachyarythmie sévère non contrôlée'],
    max_daily_dose_adult: 24,
    max_daily_dose_child: 12,
    toxicity_thresholds: { adult_toxic_dose: 32 },
    overdose_management: 'Surveillance cardiaque, potassium et réponse respiratoire.',
    pharmacological_data: { mechanism: 'Agoniste bêta-2 de courte durée' },
  },
  {
    name: 'Prednisone',
    generic_name: 'prednisone',
    category: 'Corticosteroid',
    dosage_form: 'comprimé',
    default_dosage: '5-60 mg/j',
    warnings: 'Peut majorer la glycémie et masquer un tableau infectieux.',
    contraindications: ['Infection non contrôlée sans surveillance', 'Usage prolongé non monitoré'],
    max_daily_dose_adult: 60,
    max_daily_dose_child: 2,
    toxicity_thresholds: { adult_toxic_dose: 80 },
    overdose_management: 'Surveillance glycémique et infectieuse.',
    pharmacological_data: { mechanism: 'Glucocorticoïde systémique' },
  },
]

const patients = [
  {
    medical_record_number: 'DEMO-CKD-001',
    first_name: 'Mourad',
    last_name: 'Benali',
    date_of_birth: '1946-04-18',
    gender: 'MALE',
    weight: 82,
    height: 172,
    pregnancy_status: false,
    breastfeeding_status: false,
    smoking_status: 'former',
    alcohol_use: 'regular',
    stress_level: 'high',
    sleep_quality: 'poor',
    renal_creatinine_clearance: 24,
    hepatic_status: 'mild',
    immunodepression: 'none',
  },
  {
    medical_record_number: 'DEMO-PREG-002',
    first_name: 'Sara',
    last_name: 'Ait El Hadj',
    date_of_birth: '1994-09-02',
    gender: 'FEMALE',
    weight: 68,
    height: 166,
    pregnancy_status: true,
    pregnancy_trimester: 'THIRD_TRIMESTER',
    breastfeeding_status: false,
    smoking_status: 'never',
    alcohol_use: 'none',
    stress_level: 'moderate',
    sleep_quality: 'average',
    renal_creatinine_clearance: 102,
    hepatic_status: 'normal',
    immunodepression: 'none',
  },
  {
    medical_record_number: 'DEMO-PED-003',
    first_name: 'Yanis',
    last_name: 'El Idrissi',
    date_of_birth: '2019-12-11',
    gender: 'MALE',
    weight: 18,
    height: 108,
    pregnancy_status: false,
    breastfeeding_status: false,
    smoking_status: 'never',
    alcohol_use: 'none',
    stress_level: 'low',
    sleep_quality: 'good',
    renal_creatinine_clearance: 130,
    hepatic_status: 'normal',
    immunodepression: 'none',
  },
  {
    medical_record_number: 'DEMO-EMERG-004',
    first_name: 'Nadia',
    last_name: 'Rami',
    date_of_birth: '1981-03-22',
    gender: 'FEMALE',
    weight: 61,
    height: 160,
    pregnancy_status: false,
    breastfeeding_status: false,
    smoking_status: 'active',
    alcohol_use: 'occasional',
    stress_level: 'extreme',
    sleep_quality: 'poor',
    renal_creatinine_clearance: 95,
    hepatic_status: 'normal',
    immunodepression: 'none',
  },
  {
    medical_record_number: 'DEMO-TOX-005',
    first_name: 'Hassan',
    last_name: 'Kabbaj',
    date_of_birth: '1972-07-30',
    gender: 'MALE',
    weight: 88,
    height: 176,
    pregnancy_status: false,
    breastfeeding_status: false,
    smoking_status: 'active',
    alcohol_use: 'heavy',
    stress_level: 'high',
    sleep_quality: 'poor',
    renal_creatinine_clearance: 88,
    hepatic_status: 'moderate',
    immunodepression: 'none',
  },
  {
    medical_record_number: 'DEMO-DOSE-006',
    first_name: 'Leila',
    last_name: 'Zerhouni',
    date_of_birth: '1958-11-05',
    gender: 'FEMALE',
    weight: 52,
    height: 158,
    pregnancy_status: false,
    breastfeeding_status: false,
    smoking_status: 'former',
    alcohol_use: 'none',
    stress_level: 'moderate',
    sleep_quality: 'average',
    renal_creatinine_clearance: 28,
    hepatic_status: 'mild',
    immunodepression: 'chronic_immunosuppression',
  },
]

const patientConditions = {
  'DEMO-CKD-001': [
    { condition_name: 'CKD stage 4', category: 'RENAL', severity: 'SEVERE', status: 'ACTIVE', notes: 'Stabilisé mais fonction rénale fragile.' },
    { condition_name: 'Hypertension', category: 'CARDIOVASCULAR', severity: 'MODERATE', status: 'ACTIVE', notes: 'Surveillance tensionnelle régulière.' },
    { condition_name: 'Diabetes type 2', category: 'ENDOCRINE', severity: 'MODERATE', status: 'CHRONIC', notes: 'Contrôle glycémique irrégulier.' },
  ],
  'DEMO-PREG-002': [
    { condition_name: 'Pregnancy', category: 'OBSTETRICAL', severity: 'MODERATE', status: 'ACTIVE', notes: 'Troisième trimestre.' },
    { condition_name: 'Asthma', category: 'RESPIRATORY', severity: 'MODERATE', status: 'CHRONIC', notes: 'Crises saisonnières.' },
  ],
  'DEMO-PED-003': [
    { condition_name: 'Viral fever', category: 'INFECTIOUS', severity: 'MODERATE', status: 'ACTIVE', notes: 'Fièvre et mauvaise prise orale.' },
  ],
  'DEMO-EMERG-004': [
    { condition_name: 'Severe asthma', category: 'RESPIRATORY', severity: 'SEVERE', status: 'ACTIVE', notes: 'Exacerbation aiguë.' },
    { condition_name: 'Allergic disease', category: 'IMMUNOALLERGIC', severity: 'MODERATE', status: 'CHRONIC', notes: 'Terrain atopique.' },
  ],
  'DEMO-TOX-005': [
    { condition_name: 'Chronic liver disease', category: 'HEPATIC', severity: 'SEVERE', status: 'ACTIVE', notes: 'Foie fragile et alcoolisation chronique.' },
    { condition_name: 'Alcohol use disorder', category: 'LIFESTYLE', severity: 'MODERATE', status: 'CHRONIC', notes: 'Consommation lourde.' },
  ],
  'DEMO-DOSE-006': [
    { condition_name: 'Type 2 diabetes', category: 'ENDOCRINE', severity: 'MODERATE', status: 'CHRONIC', notes: 'Nécessite ajustement posologique.' },
    { condition_name: 'Chronic kidney disease', category: 'RENAL', severity: 'SEVERE', status: 'ACTIVE', notes: 'DFG bas.' },
    { condition_name: 'Immunosuppression', category: 'IMMUNE', severity: 'MODERATE', status: 'CHRONIC', notes: 'Suivi régulier.' },
  ],
    sleep_hours: 7,
}

const patientAllergies = {
  'DEMO-CKD-001': [
    { allergen_name: 'Pollen', allergen_category: 'RESPIRATORY', reaction_type: 'RHINITIS', severity: 'LOW', onset_delay: 'DELAYED' },
  ],
  'DEMO-PREG-002': [
    blood_donor: false,
    blood_donation_details: null,
    sun_exposure: 'low',
    sun_exposure_details: 'Exposition solaire limitée.',
    housing_conditions: 'Stable',
    occupational_exposure: 'none',
    { allergen_name: 'Penicillin', allergen_category: 'DRUG', reaction_type: 'RASH', severity: 'MODERATE', onset_delay: '1_HOUR' },
  ],
  'DEMO-PED-003': [
    { allergen_name: 'Peanut', allergen_category: 'FOOD', reaction_type: 'URTICARIA', severity: 'MODERATE', onset_delay: 'IMMEDIATE' },
  ],
  'DEMO-EMERG-004': [
    { allergen_name: 'Bee venom', allergen_category: 'INSECT', reaction_type: 'ANAPHYLAXIS', severity: 'CRITICAL', onset_delay: 'IMMEDIATE' },
  ],
  'DEMO-TOX-005': [
    { allergen_name: 'Latex', allergen_category: 'OTHER', reaction_type: 'CONTACT_DERMATITIS', severity: 'LOW', onset_delay: 'HALF_DAY' },
  ],
  'DEMO-DOSE-006': [
    { allergen_name: 'Sulfonamides', allergen_category: 'DRUG', reaction_type: 'RASH', severity: 'MODERATE', onset_delay: '1_DAY' },
  ],
}

const patientLifestyle = {
  'DEMO-CKD-001': {
    smoking_details: 'Tabagisme ancien, arrêt depuis 6 ans.',
    alcohol_details: 'Consommation occasionnelle.',
    toxic_exposure: false,
    prolonged_fasting: false,
    night_shift: false,
    physical_activity_details: 'Marche légère.',
    diet_details: 'Régime pauvre en sel.',
    hydration_notes: 'Hydratation irrégulière.',
    stress_details: 'Stress modéré lié aux comorbidités.',
    sleep_details: 'Sommeil fragmenté.',
    special_condition_type: 'RENAL',
    special_diagnosis: 'CKD stage 4',
    special_active_disease: true,
    immunodepression: 'none',
    medical_followup_status: 'regular',
    hidden_self_medication: true,
    hidden_self_medication_details: 'Prise occasionnelle d\'AINS en automédication.',
  },
  'DEMO-PREG-002': {
    smoking_details: 'Non fumeuse.',
    alcohol_details: 'Aucune consommation.',
    toxic_exposure: false,
    prolonged_fasting: false,
    physical_activity_details: 'Activité douce.',
    diet_details: 'Alimentation équilibrée.',
    hydration_notes: 'Hydratation correcte.',
    stress_details: 'Stress modéré.',
    sleep_details: 'Sommeil réduit au 3e trimestre.',
    special_condition_type: 'OBSTETRICAL',
    special_diagnosis: 'Grossesse au troisième trimestre',
    special_active_disease: true,
    immunodepression: 'none',
    medical_followup_status: 'regular',
    sudden_medication_stop: false,
  },
  'DEMO-PED-003': {
    smoking_details: 'Non applicable.',
    alcohol_details: 'Non applicable.',
    toxic_exposure: false,
    prolonged_fasting: true,
    fasting_type: 'INTERMITTENT',
    fasting_frequency: 'DAYTIME',
    fasting_symptoms: 'fatigue',
    physical_activity_details: 'Joue dehors plusieurs heures.',
    diet_details: 'Apport oral réduit.',
    hydration_notes: 'Apports diminués pendant la fièvre.',
    stress_details: 'Inconfort fébrile.',
    sleep_details: 'Sommeil perturbé.',
    special_condition_type: 'PEDIATRIC',
    special_diagnosis: 'Fièvre virale',
    special_active_disease: true,
    immunodepression: 'none',
    medical_followup_status: 'regular',
  },
  'DEMO-EMERG-004': {
    smoking_details: 'Fumeuse active.',
    alcohol_details: 'Consommation occasionnelle.',
    toxic_exposure: false,
    prolonged_fasting: false,
    physical_activity_details: 'Réduit par dyspnée.',
    diet_details: 'Repas irréguliers.',
    hydration_notes: 'Hydratation faible depuis 24 h.',
    stress_details: 'Anxiété majeure.',
    sleep_details: 'Insomnie de crise.',
    special_condition_type: 'RESPIRATORY',
    special_diagnosis: 'Asthme sévère',
    special_active_disease: true,
    immunodepression: 'none',
    medical_followup_status: 'urgent',
  },
  'DEMO-TOX-005': {
    smoking_details: 'Fumeur actif.',
    alcohol_details: 'Consommation lourde quotidienne.',
    toxic_exposure: true,
    toxic_exposure_details: 'Exposition répétée à l\'alcool et prise d\'antalgiques.',
    prolonged_fasting: false,
    physical_activity_details: 'Fatigabilité élevée.',
    diet_details: 'Repas irréguliers.',
    hydration_notes: 'Hydratation faible.',
    stress_details: 'Stress professionnel.',
    sleep_details: 'Sommeil insuffisant.',
    special_condition_type: 'HEPATIC',
    special_diagnosis: 'Hépatopathie chronique',
    special_active_disease: true,
    immunodepression: 'none',
    medical_followup_status: 'regular',
    previous_intoxication: true,
  },
  'DEMO-DOSE-006': {
    smoking_details: 'Ancienne fumeuse.',
    alcohol_details: 'Aucune consommation.',
    toxic_exposure: false,
    prolonged_fasting: true,
    fasting_type: 'RELIGIOUS',
    fasting_frequency: 'DAILY',
    fasting_symptoms: 'malaise',
    physical_activity_details: 'Marche modérée.',
    diet_details: 'Restriction hydrique intermittente.',
    hydration_notes: 'Hydratation limite.',
    stress_details: 'Fatigue chronique.',
    sleep_details: 'Sommeil moyen.',
    special_condition_type: 'IMMUNE',
    special_diagnosis: 'Immunosuppression chronique',
    special_active_disease: true,
    immunodepression: 'chronic',
    medical_followup_status: 'regular',
    hidden_self_medication: true,
    hidden_self_medication_details: 'Usage ponctuel de phytothérapie.',
  },
}

const interactions = [
  {
    pair: ['Ibuprofène', 'Warfarine'],
    interaction_type: 'Drug-Drug',
    severity: 'HIGH',
    description: 'Association AINS + anticoagulant augmentant le risque hémorragique.',
    recommendation: 'Éviter l\'association ou renforcer la surveillance du saignement et de l\'INR.',
  },
  {
    pair: ['Ibuprofène', 'Énalapril'],
    interaction_type: 'Drug-Drug',
    severity: 'HIGH',
    description: 'L\'AINS peut réduire l\'effet antihypertenseur et majorer le risque rénal.',
    recommendation: 'Surveiller la fonction rénale et la pression artérielle.',
  },
  {
    pair: ['Énalapril', 'Furosémide'],
    interaction_type: 'Drug-Drug',
    severity: 'MODERATE',
    description: 'Association fréquemment utile mais à risque d\'hypotension et d\'altération rénale.',
    recommendation: 'Surveiller tension, créatinine et électrolytes.',
  },
  {
    pair: ['Metformine', 'Furosémide'],
    interaction_type: 'Drug-Drug',
    severity: 'MODERATE',
    description: 'Déshydratation ou insuffisance rénale peuvent majorer le risque de mauvaise tolérance de la metformine.',
    recommendation: 'Réévaluer la dose si hypovolémie ou DFG abaissé.',
  },
  {
    pair: ['Paracétamol', 'Warfarine'],
    interaction_type: 'Drug-Drug',
    severity: 'MODERATE',
    description: 'Usage répété du paracétamol peut modifier l\'équilibre anticoagulant.',
    recommendation: 'Surveiller l\'INR si prise répétée.',
  },
]

const clinicalRules = [
  {
    name: 'Terrain fragile patient chronique',
    rule_family: 'PATIENT_RISK',
    category: 'PATIENT_PROFILE',
    severity: 'MODERATE',
    priority: 10,
    trigger_type: 'CLINICAL_PROFILE',
    explanation_template: 'Le terrain patient augmente le risque global et nécessite une surveillance renforcée.',
    conditions: {
      logic: 'AND',
      conditions: [
        { type: 'AGE', field: 'patient.age', operator: '>=', value: 65 },
        { type: 'CONDITION', field: 'patient.renal_creatinine_clearance', operator: '<', value: 45 },
      ],
    },
    outputs: {
      risk_scores: { renal: 25, toxicity: 10, interaction: 10 },
      recommendations: ['Adapter la surveillance biologique et réévaluer les traitements à risque rénal.'],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'patient-risk', DEMO_TAG],
  },
  {
    name: 'Contre-indication AINS et insuffisance rénale sévère',
    rule_family: 'CONTRAINDICATION',
    category: 'RENAL_CONTRAINDICATION',
    severity: 'HIGH',
    priority: 90,
    trigger_type: 'ON_MEDICATION',
    explanation_template: 'Un médicament à risque rénal ne doit pas être poursuivi sans réévaluation dans ce contexte.',
    conditions: {
      logic: 'AND',
      conditions: [
        { type: 'MEDICATION', field: 'medications.category', operator: 'includes', value: 'NSAID' },
        { type: 'CONDITION', field: 'patient.renal_creatinine_clearance', operator: '<', value: 30 },
      ],
    },
    outputs: {
      contraindications: [
        { target: 'Ibuprofène', reason: 'Insuffisance rénale sévère avec risque d\'aggravation fonctionnelle.', severity: 'CRITICAL' },
      ],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'contraindication', DEMO_TAG],
  },
  {
    name: 'Interaction AINS - anticoagulant',
    rule_family: 'DRUG_INTERACTION',
    category: 'INTERACTION',
    severity: 'HIGH',
    priority: 80,
    trigger_type: 'ON_MEDICATION',
    explanation_template: 'L\'association médicamenteuse crée un risque de saignement cliniquement significatif.',
    conditions: {
      logic: 'AND',
      conditions: [
        { type: 'MEDICATION', field: 'medications.name', operator: 'includes', value: 'Ibuprofène' },
        { type: 'MEDICATION', field: 'medications.name', operator: 'includes', value: 'Warfarine' },
      ],
    },
    outputs: {
      alerts: [
        { type: 'interaction_alert', severity: 'HIGH', message: 'Risque hémorragique par association AINS + anticoagulant.' },
      ],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'interaction', DEMO_TAG],
  },
  {
    name: 'Toxicologie alcool et paracétamol',
    rule_family: 'TOXICOLOGY',
    category: 'TOXICOLOGY',
    severity: 'HIGH',
    priority: 85,
    trigger_type: 'ON_LAB_AND_MEDICATION',
    explanation_template: 'Le contexte toxique doit être interprété avec l\'exposition médicamenteuse et hépatique.',
    conditions: {
      logic: 'AND',
      conditions: [
        { type: 'MEDICATION', field: 'medications.name', operator: 'includes', value: 'Paracétamol' },
        { type: 'CONDITION', field: 'patient.alcohol_use', operator: 'includes', value: 'heavy' },
        { type: 'LAB_RESULT', field: 'labs.alat.value', operator: '>', value: 60 },
      ],
    },
    outputs: {
      alerts: [
        { type: 'toxicology_alert', severity: 'HIGH', message: 'Risque hépatotoxique augmenté en contexte d\'alcoolisation chronique.' },
      ],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'toxicology', DEMO_TAG],
  },
  {
    name: 'Surdosage pédiatrique par fréquence excessive',
    rule_family: 'OVERDOSE',
    category: 'OVERDOSE',
    severity: 'CRITICAL',
    priority: 95,
    trigger_type: 'ON_MEDICATION',
    explanation_template: 'La fréquence et le contexte pédiatrique exposent à un surdosage clinique.',
    conditions: {
      logic: 'AND',
      conditions: [
        { type: 'MEDICATION', field: 'medications.name', operator: 'includes', value: 'Paracétamol' },
        { type: 'AGE', field: 'patient.age', operator: '<', value: 12 },
        { type: 'MEDICATION', field: 'medications.frequency', operator: 'includes', value: 'EVERY_4_HOURS' },
      ],
    },
    outputs: {
      alerts: [
        { type: 'overdose_alert', severity: 'CRITICAL', message: 'Fréquence de prise trop rapprochée pour un enfant à risque de surdosage.' },
      ],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'overdose', DEMO_TAG],
  },
  {
    name: 'Urgence vitale respiratoire et hémodynamique',
    rule_family: 'EMERGENCY',
    category: 'EMERGENCY',
    severity: 'CRITICAL',
    priority: 100,
    trigger_type: 'ON_EMERGENCY_FLAG',
    explanation_template: 'La situation clinique impose une prise en charge immédiate.',
    conditions: {
      logic: 'OR',
      conditions: [
        { type: 'VITAL_SIGN', field: 'vitals.spo2', operator: '<', value: 85 },
        { type: 'VITAL_SIGN', field: 'vitals.systolic_bp', operator: '<', value: 90 },
        { type: 'EMERGENCY_FLAG', field: 'emergency_flags', operator: 'includes', value: 'severe_allergic_reaction' },
        { type: 'EMERGENCY_FLAG', field: 'emergency_flags', operator: 'includes', value: 'coma' },
      ],
    },
    outputs: {
      urgency: 'CRITICAL',
      alerts: [
        { type: 'emergency_alert', severity: 'CRITICAL', message: 'Urgence vitale: assurer l\'évaluation ABC, oxygénation et appel médical immédiat.' },
      ],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'emergency', DEMO_TAG],
  },
  {
    name: 'Avertissement thérapeutique jeûne et antidiabétique',
    rule_family: 'THERAPEUTIC_WARNING',
    category: 'THERAPEUTIC_WARNING',
    severity: 'MODERATE',
    priority: 60,
    trigger_type: 'ON_PROFILE_AND_MEDICATION',
    explanation_template: 'Le contexte clinique impose une surveillance thérapeutique renforcée.',
    conditions: {
      logic: 'AND',
      conditions: [
        { type: 'CONDITION', field: 'lifestyle.prolonged_fasting', operator: '=', value: true },
        { type: 'MEDICATION', field: 'medications.category', operator: 'includes', value: 'Antidiabetic' },
      ],
    },
    outputs: {
      therapeutic_warnings: [
        { warning: 'Le jeûne prolongé peut majorer le risque de malaise et d\'hypoglycémie en contexte antidiabétique.' },
      ],
      recommendations: ['Adapter l\'horaire des prises et surveiller les glycémies lors des périodes de jeûne.'],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'therapeutic-warning', DEMO_TAG],
  },
  {
    name: 'Ajustement posologique rénal',
    rule_family: 'DOSING_ADJUSTMENT',
    category: 'DOSING_ADJUSTMENT',
    severity: 'HIGH',
    priority: 70,
    trigger_type: 'ON_LAB_RESULT',
    explanation_template: 'La fonction rénale impose un ajustement des posologies et une réévaluation du schéma.',
    conditions: {
      logic: 'AND',
      conditions: [
        { type: 'LAB_RESULT', field: 'labs.creatinine.value', operator: '>', value: 1.5 },
        { type: 'CONDITION', field: 'patient.renal_creatinine_clearance', operator: '<', value: 30 },
      ],
    },
    outputs: {
      dosing_adjustments: [
        { medication: 'Metformine', adjustment: 'Réévaluer / éviter si DFG < 30 mL/min', rationale: 'Réduction du risque d\'acidose lactique.' },
        { medication: 'Énalapril', adjustment: 'Surveillance de la créatinine et du potassium', rationale: 'Préserver la fonction rénale et éviter l\'hyperkaliémie.' },
      ],
    },
    created_by: 'clinical-demo',
    tags: ['demo', 'dose-adjustment', DEMO_TAG],
  },
]

const cases = [
  {
    patient_mrn: 'DEMO-CKD-001',
    case_type: 'follow_up',
    chief_complaint: 'Contrôle de fatigue et douleurs articulaires',
    symptoms: ['fatigue', 'edema', 'joint_pain'],
    priority_level: 'high',
    status: 'active',
    medications: [
      { name: 'Ibuprofène', dosage: '400 mg', frequency: 'EVERY_8_HOURS', route: 'ORAL' },
      { name: 'Énalapril', dosage: '10 mg', frequency: 'ONCE_DAILY', route: 'ORAL' },
      { name: 'Furosémide', dosage: '40 mg', frequency: 'ONCE_DAILY', route: 'ORAL' },
      { name: 'Metformine', dosage: '500 mg', frequency: 'TWICE_DAILY', route: 'ORAL' },
    ],
    vitals: { systolic_bp: 96, diastolic_bp: 58, heart_rate: 88, respiratory_rate: 18, temperature_c: 36.8, spo2: 95, consciousness_state: 'normal' },
    labs: [
      { test_name: 'creatinine', value: 2.6, unit: 'mg/dL', abnormal_flag: 'high' },
      { test_name: 'potassium', value: 5.7, unit: 'mmol/L', abnormal_flag: 'high' },
      { test_name: 'alat', value: 42, unit: 'U/L', abnormal_flag: 'mildly_high' },
    ],
    emergency_flags: { respiratory_distress: false, hemodynamic_instability: false, coma: false, cardiac_arrest: false, severe_arrhythmia: false, severe_allergic_reaction: false, major_bleeding: false, convulsions: false, urgency_level: 'moderate' },
    risk_assessment: { score: 68, level: 'high' },
  },
  {
    patient_mrn: 'DEMO-PREG-002',
    case_type: 'urgent_consult',
    chief_complaint: 'Douleurs, fièvre légère et automédication',
    symptoms: ['fever', 'headache', 'cough'],
    priority_level: 'high',
    status: 'active',
    medications: [
      { name: 'Ibuprofène', dosage: '400 mg', frequency: 'EVERY_8_HOURS', route: 'ORAL' },
      { name: 'Amoxicilline', dosage: '1 g', frequency: 'TWICE_DAILY', route: 'ORAL' },
    ],
    vitals: { systolic_bp: 108, diastolic_bp: 68, heart_rate: 92, respiratory_rate: 18, temperature_c: 37.9, spo2: 98, consciousness_state: 'normal' },
    labs: [
      { test_name: 'creatinine', value: 0.7, unit: 'mg/dL', abnormal_flag: 'normal' },
      { test_name: 'alat', value: 18, unit: 'U/L', abnormal_flag: 'normal' },
    ],
    emergency_flags: { respiratory_distress: false, hemodynamic_instability: false, coma: false, cardiac_arrest: false, severe_arrhythmia: false, severe_allergic_reaction: false, major_bleeding: false, convulsions: false, urgency_level: 'low' },
    risk_assessment: { score: 55, level: 'moderate' },
  },
  {
    patient_mrn: 'DEMO-PED-003',
    case_type: 'pediatric',
    chief_complaint: 'Fièvre et prise rapprochée de paracétamol',
    symptoms: ['nausea', 'vomiting', 'abdominal_pain', 'fever'],
    priority_level: 'high',
    status: 'active',
    medications: [
      { name: 'Paracétamol', dosage: '500 mg', frequency: 'EVERY_4_HOURS', route: 'ORAL' },
      { name: 'Salbutamol', dosage: '2 bouffées', frequency: 'AS_NEEDED', route: 'INHALATION' },
    ],
    vitals: { systolic_bp: 100, diastolic_bp: 62, heart_rate: 122, respiratory_rate: 24, temperature_c: 38.9, spo2: 97, consciousness_state: 'normal' },
    labs: [
      { test_name: 'alat', value: 35, unit: 'U/L', abnormal_flag: 'normal' },
      { test_name: 'asat', value: 40, unit: 'U/L', abnormal_flag: 'normal' },
    ],
    emergency_flags: { respiratory_distress: false, hemodynamic_instability: false, coma: false, cardiac_arrest: false, severe_arrhythmia: false, severe_allergic_reaction: false, major_bleeding: false, convulsions: false, urgency_level: 'moderate' },
    risk_assessment: { score: 74, level: 'high' },
  },
  {
    patient_mrn: 'DEMO-EMERG-004',
    case_type: 'emergency',
    chief_complaint: 'Crise respiratoire aiguë après exposition allergique',
    symptoms: ['dyspnea', 'wheezing', 'urticaria'],
    priority_level: 'critical',
    status: 'active',
    medications: [
      { name: 'Salbutamol', dosage: '4 bouffées', frequency: 'AS_NEEDED', route: 'INHALATION' },
      { name: 'Prednisone', dosage: '40 mg', frequency: 'ONCE_DAILY', route: 'ORAL' },
    ],
    vitals: { systolic_bp: 84, diastolic_bp: 50, heart_rate: 136, respiratory_rate: 32, temperature_c: 37.1, spo2: 82, consciousness_state: 'confusion' },
    labs: [
      { test_name: 'lactates', value: 3.8, unit: 'mmol/L', abnormal_flag: 'high' },
    ],
    emergency_flags: { respiratory_distress: true, hemodynamic_instability: true, coma: false, cardiac_arrest: false, severe_arrhythmia: false, severe_allergic_reaction: true, major_bleeding: false, convulsions: false, urgency_level: 'critical' },
    risk_assessment: { score: 94, level: 'critical' },
  },
  {
    patient_mrn: 'DEMO-TOX-005',
    case_type: 'toxicology',
    chief_complaint: 'Douleurs diffuses et consommation excessive d\'antalgiques',
    symptoms: ['nausea', 'right_upper_quadrant_pain', 'fatigue'],
    priority_level: 'high',
    status: 'active',
    medications: [
      { name: 'Paracétamol', dosage: '1000 mg', frequency: 'EVERY_6_HOURS', route: 'ORAL' },
      { name: 'Warfarine', dosage: '5 mg', frequency: 'ONCE_DAILY', route: 'ORAL' },
    ],
    vitals: { systolic_bp: 112, diastolic_bp: 70, heart_rate: 96, respiratory_rate: 20, temperature_c: 37.4, spo2: 96, consciousness_state: 'normal' },
    labs: [
      { test_name: 'alat', value: 186, unit: 'U/L', abnormal_flag: 'high' },
      { test_name: 'asat', value: 210, unit: 'U/L', abnormal_flag: 'high' },
      { test_name: 'creatinine', value: 1.1, unit: 'mg/dL', abnormal_flag: 'normal' },
    ],
    emergency_flags: { respiratory_distress: false, hemodynamic_instability: false, coma: false, cardiac_arrest: false, severe_arrhythmia: false, severe_allergic_reaction: false, major_bleeding: false, convulsions: false, urgency_level: 'high' },
    risk_assessment: { score: 81, level: 'high' },
  },
  {
    patient_mrn: 'DEMO-DOSE-006',
    case_type: 'chronic_follow_up',
    chief_complaint: 'Réévaluation du traitement et fatigue sur jeûne',
    symptoms: ['fatigue', 'malaise', 'dizziness'],
    priority_level: 'moderate',
    status: 'active',
    medications: [
      { name: 'Metformine', dosage: '1000 mg', frequency: 'TWICE_DAILY', route: 'ORAL' },
      { name: 'Énalapril', dosage: '20 mg', frequency: 'ONCE_DAILY', route: 'ORAL' },
    ],
    vitals: { systolic_bp: 94, diastolic_bp: 60, heart_rate: 86, respiratory_rate: 18, temperature_c: 36.6, spo2: 97, consciousness_state: 'normal' },
    labs: [
      { test_name: 'creatinine', value: 1.9, unit: 'mg/dL', abnormal_flag: 'high' },
      { test_name: 'potassium', value: 5.4, unit: 'mmol/L', abnormal_flag: 'high' },
      { test_name: 'glycemia', value: 1.3, unit: 'g/L', abnormal_flag: 'normal' },
    ],
    emergency_flags: { respiratory_distress: false, hemodynamic_instability: false, coma: false, cardiac_arrest: false, severe_arrhythmia: false, severe_allergic_reaction: false, major_bleeding: false, convulsions: false, urgency_level: 'moderate' },
    risk_assessment: { score: 66, level: 'moderate' },
  },
]

function getPatientAge(dateOfBirth) {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--
  return age
}

async function getSeedUserId() {
  let user = await sql`SELECT id FROM users WHERE specialization = 'admin' LIMIT 1`
  if (!user.length) user = await sql`SELECT id FROM users WHERE email = 'admin@hexa.local' LIMIT 1`
  if (!user.length) user = await sql`SELECT id FROM users WHERE email = 'medecin@hexa.local' LIMIT 1`
  if (!user.length) user = await sql`SELECT id FROM users LIMIT 1`
  if (user.length) return user[0].id
  const created = await sql`INSERT INTO users (email, password_hash, full_name, specialization, created_at) VALUES ('seed@local', '', 'Seed User', 'seed', now()) RETURNING id`
  return created[0].id
}

async function upsertMedication(data) {
  const existing = await sql`SELECT id FROM medications WHERE name = ${data.name} LIMIT 1`
  if (existing.length) {
    const id = existing[0].id
    await sql`
      UPDATE medications SET
        generic_name = ${data.generic_name},
        category = ${data.category},
        dosage_form = ${data.dosage_form},
        default_dosage = ${data.default_dosage},
        warnings = ${data.warnings},
        contraindications = ${sql.json(data.contraindications)},
        max_daily_dose_adult = ${data.max_daily_dose_adult},
        max_daily_dose_child = ${data.max_daily_dose_child},
        toxicity_thresholds = ${sql.json(data.toxicity_thresholds)},
        overdose_management = ${data.overdose_management},
        pharmacological_data = ${sql.json(data.pharmacological_data)},
        created_at = now()
      WHERE id = ${id}
    `
    return id
  }
  const res = await sql`
    INSERT INTO medications (
      name, generic_name, category, dosage_form, default_dosage, warnings, contraindications,
      max_daily_dose_adult, max_daily_dose_child, toxicity_thresholds, overdose_management, pharmacological_data, created_at
    ) VALUES (
      ${data.name}, ${data.generic_name}, ${data.category}, ${data.dosage_form}, ${data.default_dosage}, ${data.warnings}, ${sql.json(data.contraindications)},
      ${data.max_daily_dose_adult}, ${data.max_daily_dose_child}, ${sql.json(data.toxicity_thresholds)}, ${data.overdose_management}, ${sql.json(data.pharmacological_data)}, now()
    ) RETURNING id
  `
  return res[0].id
}

async function upsertInteraction(medicationId1, medicationId2, data) {
  const existing = await sql`
    SELECT id FROM interactions
    WHERE (medication_id_1 = ${medicationId1} AND medication_id_2 = ${medicationId2})
       OR (medication_id_1 = ${medicationId2} AND medication_id_2 = ${medicationId1})
    LIMIT 1
  `
  if (existing.length) {
    const id = existing[0].id
    await sql`
      UPDATE interactions SET
        interaction_type = ${data.interaction_type},
        severity = ${data.severity},
        description = ${data.description},
        recommendation = ${data.recommendation},
        created_at = now()
      WHERE id = ${id}
    `
    return id
  }
  const res = await sql`
    INSERT INTO interactions (
      medication_id_1, medication_id_2, interaction_type, severity, description, recommendation, created_at
    ) VALUES (
      ${medicationId1}, ${medicationId2}, ${data.interaction_type}, ${data.severity}, ${data.description}, ${data.recommendation}, now()
    ) RETURNING id
  `
  return res[0].id
}

async function upsertRule(rule) {
  const existing = await sql`SELECT id FROM clinical_rules WHERE name = ${rule.name} LIMIT 1`
  if (existing.length) {
    const id = existing[0].id
    await sql`
      UPDATE clinical_rules SET
        description = ${rule.description ?? null},
        category = ${rule.category},
        severity = ${rule.severity},
        priority = ${rule.priority},
        enabled = ${rule.enabled ?? true},
        trigger_type = ${rule.trigger_type},
        conditions = ${JSON.stringify(rule.conditions)},
        outputs = ${JSON.stringify(rule.outputs)},
        created_by = ${rule.created_by},
        tags = ${rule.tags},
        updated_at = now()
      WHERE id = ${id}
    `
    return id
  }
  const res = await sql`
    INSERT INTO clinical_rules (
      name, description, category, severity, priority, enabled, trigger_type,
      conditions, outputs, created_at, updated_at, created_by, tags
    ) VALUES (
      ${rule.name}, ${rule.description ?? null}, ${rule.category}, ${rule.severity}, ${rule.priority}, ${rule.enabled ?? true}, ${rule.trigger_type},
      ${JSON.stringify(rule.conditions)}, ${JSON.stringify(rule.outputs)}, now(), now(), ${rule.created_by}, ${rule.tags}
    ) RETURNING id
  `
  return res[0].id
}

async function upsertPatient(patient) {
  const existing = await sql`SELECT id FROM patients WHERE medical_record_number = ${patient.medical_record_number} LIMIT 1`
  const userId = await getSeedUserId()
  if (existing.length) {
    const id = existing[0].id
    await sql`
      UPDATE patients SET
        user_id = ${userId},
        first_name = ${patient.first_name},
        last_name = ${patient.last_name},
        date_of_birth = ${patient.date_of_birth},
        gender = ${patient.gender},
        weight = ${patient.weight},
        height = ${patient.height},
        pregnancy_status = ${patient.pregnancy_status ?? false},
        pregnancy_trimester = ${patient.pregnancy_trimester ?? null},
        breastfeeding_status = ${patient.breastfeeding_status ?? false},
        smoking_status = ${patient.smoking_status ?? null},
        alcohol_use = ${patient.alcohol_use ?? null},
        physical_activity = ${patient.physical_activity ?? null},
        stress_level = ${patient.stress_level ?? null},
        sleep_quality = ${patient.sleep_quality ?? null},
        medical_record_number = ${patient.medical_record_number},
        created_at = created_at
      WHERE id = ${id}
    `
    return id
  }
  const res = await sql`
    INSERT INTO patients (
      user_id, first_name, last_name, date_of_birth, gender, medical_record_number, weight, height,
      pregnancy_status, pregnancy_trimester, breastfeeding_status, smoking_status, alcohol_use, physical_activity, stress_level, sleep_quality, created_at
    ) VALUES (
      ${userId}, ${patient.first_name}, ${patient.last_name}, ${patient.date_of_birth}, ${patient.gender}, ${patient.medical_record_number}, ${patient.weight}, ${patient.height},
      ${patient.pregnancy_status ?? false}, ${patient.pregnancy_trimester ?? null}, ${patient.breastfeeding_status ?? false}, ${patient.smoking_status ?? null}, ${patient.alcohol_use ?? null}, ${patient.physical_activity ?? null}, ${patient.stress_level ?? null}, ${patient.sleep_quality ?? null}, now()
    ) RETURNING id
  `
  return res[0].id
}

async function upsertPatientCondition(patientId, condition) {
  const existing = await sql`SELECT id FROM patient_conditions WHERE patient_id = ${patientId} AND condition_name = ${condition.condition_name} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE patient_conditions SET
        category = ${condition.category},
        severity = ${condition.severity},
        status = ${condition.status},
        notes = ${condition.notes},
        diagnosed_at = ${condition.diagnosed_at ?? null}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO patient_conditions (patient_id, condition_name, category, severity, status, notes, diagnosed_at, created_at)
    VALUES (${patientId}, ${condition.condition_name}, ${condition.category}, ${condition.severity}, ${condition.status}, ${condition.notes}, ${condition.diagnosed_at ?? null}, now()) RETURNING id
  `
  return res[0].id
}

async function upsertPatientAllergy(patientId, allergy) {
  const existing = await sql`SELECT id FROM patient_allergies WHERE patient_id = ${patientId} AND allergen_name = ${allergy.allergen_name} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE patient_allergies SET
        allergen_category = ${allergy.allergen_category},
        reaction_type = ${allergy.reaction_type},
        severity = ${allergy.severity},
        onset_delay = ${allergy.onset_delay}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO patient_allergies (patient_id, allergen_name, allergen_category, reaction_type, severity, onset_delay, created_at)
    VALUES (${patientId}, ${allergy.allergen_name}, ${allergy.allergen_category}, ${allergy.reaction_type}, ${allergy.severity}, ${allergy.onset_delay}, now()) RETURNING id
  `
  return res[0].id
}

async function upsertPatientLifestyle(patientId, lifestyle) {
  const existing = await sql`SELECT id FROM patient_lifestyle WHERE patient_id = ${patientId} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE patient_lifestyle SET
        substance_use = ${lifestyle.substance_use ?? false},
        substance_type = ${lifestyle.substance_type ?? null},
        substance_frequency = ${lifestyle.substance_frequency ?? null},
        substance_route = ${lifestyle.substance_route ?? null},
        substance_duration = ${lifestyle.substance_duration ?? null},
        substance_last_use = ${lifestyle.substance_last_use ?? null},
        substance_withdrawal_signs = ${lifestyle.substance_withdrawal_signs ?? false},
        smoking_details = ${lifestyle.smoking_details ?? null},
        alcohol_details = ${lifestyle.alcohol_details ?? null},
        toxic_exposure = ${lifestyle.toxic_exposure ?? false},
        toxic_exposure_details = ${lifestyle.toxic_exposure_details ?? null},
        prolonged_fasting = ${lifestyle.prolonged_fasting ?? false},
        fasting_type = ${lifestyle.fasting_type ?? null},
        fasting_frequency = ${lifestyle.fasting_frequency ?? null},
        fasting_symptoms = ${lifestyle.fasting_symptoms ?? null},
        night_shift = ${lifestyle.night_shift ?? false},
        night_shift_details = ${lifestyle.night_shift_details ?? null},
        physical_activity_details = ${lifestyle.physical_activity_details ?? null},
        diet_details = ${lifestyle.diet_details ?? null},
        hydration_notes = ${lifestyle.hydration_notes ?? null},
        stress_details = ${lifestyle.stress_details ?? null},
        sleep_details = ${lifestyle.sleep_details ?? null},
        special_condition_type = ${lifestyle.special_condition_type ?? null},
        special_diagnosis = ${lifestyle.special_diagnosis ?? null},
        special_stage_classification = ${lifestyle.special_stage_classification ?? null},
        special_active_disease = ${lifestyle.special_active_disease ?? false},
        special_treatment_types = ${lifestyle.special_treatment_types ?? null},
        diet_type = ${lifestyle.diet_type ?? null},
        sleep_hours = ${lifestyle.sleep_hours ?? null},
        sun_exposure = ${lifestyle.sun_exposure ?? null},
        sun_exposure_details = ${lifestyle.sun_exposure_details ?? null},
        restrictive_diet = ${lifestyle.restrictive_diet ?? false},
        restrictive_diet_details = ${lifestyle.restrictive_diet_details ?? null},
        uncontrolled_natural_products = ${lifestyle.uncontrolled_natural_products ?? false},
        natural_products_details = ${lifestyle.natural_products_details ?? null},
        blood_donor = ${lifestyle.blood_donor ?? false},
        blood_donation_details = ${lifestyle.blood_donation_details ?? null},
        immunodepression = ${lifestyle.immunodepression ?? null},
        sudden_medication_stop = ${lifestyle.sudden_medication_stop ?? false},
        sudden_medication_stop_details = ${lifestyle.sudden_medication_stop_details ?? null},
        regular_checkup = ${lifestyle.regular_checkup ?? true},
        medical_followup_status = ${lifestyle.medical_followup_status ?? null},
        last_consultation = ${lifestyle.last_consultation ?? null},
        self_diagnosis = ${lifestyle.self_diagnosis ?? false},
        self_diagnosis_treatments = ${lifestyle.self_diagnosis_treatments ?? null},
        housing_conditions = ${lifestyle.housing_conditions ?? null},
        hidden_self_medication = ${lifestyle.hidden_self_medication ?? false},
        hidden_self_medication_details = ${lifestyle.hidden_self_medication_details ?? null},
        phytotherapy_details = ${lifestyle.phytotherapy_details ?? null},
        previous_intoxication = ${lifestyle.previous_intoxication ?? false}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO patient_lifestyle (
      patient_id, substance_use, substance_type, substance_frequency, substance_route, substance_duration, substance_last_use,
      substance_withdrawal_signs, smoking_details, alcohol_details, toxic_exposure, toxic_exposure_details, prolonged_fasting,
      fasting_type, fasting_frequency, fasting_symptoms, night_shift, night_shift_details, physical_activity_details, diet_details,
      hydration_notes, stress_details, sleep_details, special_condition_type, special_diagnosis, special_stage_classification,
      special_active_disease, special_treatment_types, diet_type, sleep_hours, sun_exposure, sun_exposure_details, restrictive_diet,
      restrictive_diet_details, uncontrolled_natural_products, natural_products_details, blood_donor, blood_donation_details,
      immunodepression, sudden_medication_stop, sudden_medication_stop_details, regular_checkup, medical_followup_status,
      last_consultation, self_diagnosis, self_diagnosis_treatments, housing_conditions, hidden_self_medication,
      hidden_self_medication_details, phytotherapy_details, previous_intoxication, created_at
    ) VALUES (
      ${patientId}, ${lifestyle.substance_use ?? false}, ${lifestyle.substance_type ?? null}, ${lifestyle.substance_frequency ?? null}, ${lifestyle.substance_route ?? null}, ${lifestyle.substance_duration ?? null}, ${lifestyle.substance_last_use ?? null},
      ${lifestyle.substance_withdrawal_signs ?? false}, ${lifestyle.smoking_details ?? null}, ${lifestyle.alcohol_details ?? null}, ${lifestyle.toxic_exposure ?? false}, ${lifestyle.toxic_exposure_details ?? null}, ${lifestyle.prolonged_fasting ?? false},
      ${lifestyle.fasting_type ?? null}, ${lifestyle.fasting_frequency ?? null}, ${lifestyle.fasting_symptoms ?? null}, ${lifestyle.night_shift ?? false}, ${lifestyle.night_shift_details ?? null}, ${lifestyle.physical_activity_details ?? null}, ${lifestyle.diet_details ?? null},
      ${lifestyle.hydration_notes ?? null}, ${lifestyle.stress_details ?? null}, ${lifestyle.sleep_details ?? null}, ${lifestyle.special_condition_type ?? null}, ${lifestyle.special_diagnosis ?? null}, ${lifestyle.special_stage_classification ?? null},
      ${lifestyle.special_active_disease ?? false}, ${lifestyle.special_treatment_types ?? null}, ${lifestyle.diet_type ?? null}, ${lifestyle.sleep_hours ?? null}, ${lifestyle.sun_exposure ?? null}, ${lifestyle.sun_exposure_details ?? null}, ${lifestyle.restrictive_diet ?? false},
      ${lifestyle.restrictive_diet_details ?? null}, ${lifestyle.uncontrolled_natural_products ?? false}, ${lifestyle.natural_products_details ?? null}, ${lifestyle.blood_donor ?? false}, ${lifestyle.blood_donation_details ?? null},
      ${lifestyle.immunodepression ?? null}, ${lifestyle.sudden_medication_stop ?? false}, ${lifestyle.sudden_medication_stop_details ?? null}, ${lifestyle.regular_checkup ?? true}, ${lifestyle.medical_followup_status ?? null},
      ${lifestyle.last_consultation ?? null}, ${lifestyle.self_diagnosis ?? false}, ${lifestyle.self_diagnosis_treatments ?? null}, ${lifestyle.housing_conditions ?? null}, ${lifestyle.hidden_self_medication ?? false},
      ${lifestyle.hidden_self_medication_details ?? null}, ${lifestyle.phytotherapy_details ?? null}, ${lifestyle.previous_intoxication ?? false}, now()
    ) RETURNING id
  `
  return res[0].id
}

async function upsertPatientMedication(patientId, medicationId, medData) {
  const existing = await sql`SELECT id FROM patient_medications WHERE patient_id = ${patientId} AND medication_id = ${medicationId} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE patient_medications SET
        dosage = ${medData.dosage},
        frequency = ${medData.frequency},
        route = ${medData.route},
        started_at = ${medData.started_at ?? null},
        ongoing = ${medData.ongoing ?? true}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO patient_medications (patient_id, medication_id, dosage, frequency, route, started_at, ongoing, created_at)
    VALUES (${patientId}, ${medicationId}, ${medData.dosage}, ${medData.frequency}, ${medData.route}, ${medData.started_at ?? null}, ${medData.ongoing ?? true}, now()) RETURNING id
  `
  return res[0].id
}

async function upsertCase(userId, patientId, data) {
  const existing = await sql`
    SELECT id FROM cases
    WHERE patient_id = ${patientId} AND case_type = ${data.case_type} AND chief_complaint = ${data.chief_complaint}
    LIMIT 1
  `
  if (existing.length) {
    const id = existing[0].id
    await sql`
      UPDATE cases SET
        user_id = ${userId},
        symptoms = ${JSON.stringify(data.symptoms)},
        status = ${data.status},
        priority_level = ${data.priority_level}
      WHERE id = ${id}
    `
    return id
  }
  const res = await sql`
    INSERT INTO cases (user_id, patient_id, case_type, chief_complaint, symptoms, status, priority_level, created_at)
    VALUES (${userId}, ${patientId}, ${data.case_type}, ${data.chief_complaint}, ${JSON.stringify(data.symptoms)}, ${data.status}, ${data.priority_level}, now()) RETURNING id
  `
  return res[0].id
}

async function clearCaseChildren(caseId) {
  await sql`DELETE FROM case_medications WHERE case_id = ${caseId}`
  await sql`DELETE FROM case_vitals WHERE case_id = ${caseId}`
  await sql`DELETE FROM case_lab_results WHERE case_id = ${caseId}`
  await sql`DELETE FROM case_symptoms WHERE case_id = ${caseId}`
  await sql`DELETE FROM case_emergency_flags WHERE case_id = ${caseId}`
  await sql`DELETE FROM risk_assessments WHERE case_id = ${caseId}`
}

async function addCaseMedication(caseId, medicationId, medData) {
  const existing = await sql`SELECT id FROM case_medications WHERE case_id = ${caseId} AND medication_id = ${medicationId} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE case_medications SET
        dosage = ${medData.dosage},
        frequency = ${medData.frequency},
        duration = ${medData.duration ?? null},
        route = ${medData.route}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO case_medications (case_id, medication_id, dosage, frequency, duration, route, created_at)
    VALUES (${caseId}, ${medicationId}, ${medData.dosage}, ${medData.frequency}, ${medData.duration ?? null}, ${medData.route}, now()) RETURNING id
  `
  return res[0].id
}

async function upsertCaseVitals(caseId, vitals) {
  const existing = await sql`SELECT id FROM case_vitals WHERE case_id = ${caseId} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE case_vitals SET
        systolic_bp = ${vitals.systolic_bp ?? null},
        diastolic_bp = ${vitals.diastolic_bp ?? null},
        heart_rate = ${vitals.heart_rate ?? null},
        respiratory_rate = ${vitals.respiratory_rate ?? null},
        temperature_c = ${vitals.temperature_c ?? null},
        spo2 = ${vitals.spo2 ?? null},
        consciousness_state = ${vitals.consciousness_state ?? null},
        measured_at = now()
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO case_vitals (case_id, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature_c, spo2, consciousness_state, measured_at)
    VALUES (${caseId}, ${vitals.systolic_bp ?? null}, ${vitals.diastolic_bp ?? null}, ${vitals.heart_rate ?? null}, ${vitals.respiratory_rate ?? null}, ${vitals.temperature_c ?? null}, ${vitals.spo2 ?? null}, ${vitals.consciousness_state ?? null}, now()) RETURNING id
  `
  return res[0].id
}

async function upsertCaseLabResult(caseId, lab) {
  const existing = await sql`SELECT id FROM case_lab_results WHERE case_id = ${caseId} AND test_name = ${lab.test_name} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE case_lab_results SET
        value = ${lab.value ?? null},
        unit = ${lab.unit ?? null},
        abnormal_flag = ${lab.abnormal_flag ?? null},
        measured_at = now()
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO case_lab_results (case_id, test_name, value, unit, abnormal_flag, measured_at)
    VALUES (${caseId}, ${lab.test_name}, ${lab.value ?? null}, ${lab.unit ?? null}, ${lab.abnormal_flag ?? null}, now()) RETURNING id
  `
  return res[0].id
}

async function upsertCaseSymptom(caseId, symptom) {
  const existing = await sql`SELECT id FROM case_symptoms WHERE case_id = ${caseId} AND symptom_name = ${symptom.symptom_name} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE case_symptoms SET
        severity = ${symptom.severity ?? null},
        duration = ${symptom.duration ?? null}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO case_symptoms (case_id, symptom_name, severity, duration, created_at)
    VALUES (${caseId}, ${symptom.symptom_name}, ${symptom.severity ?? null}, ${symptom.duration ?? null}, now()) RETURNING id
  `
  return res[0].id
}

async function upsertCaseEmergencyFlags(caseId, flags) {
  const existing = await sql`SELECT id FROM case_emergency_flags WHERE case_id = ${caseId} LIMIT 1`
  if (existing.length) {
    await sql`
      UPDATE case_emergency_flags SET
        convulsions = ${flags.convulsions ?? false},
        respiratory_distress = ${flags.respiratory_distress ?? false},
        hemodynamic_instability = ${flags.hemodynamic_instability ?? false},
        coma = ${flags.coma ?? false},
        cardiac_arrest = ${flags.cardiac_arrest ?? false},
        severe_arrhythmia = ${flags.severe_arrhythmia ?? false},
        severe_allergic_reaction = ${flags.severe_allergic_reaction ?? false},
        major_bleeding = ${flags.major_bleeding ?? false},
        urgency_level = ${flags.urgency_level ?? null}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO case_emergency_flags (
      case_id, convulsions, respiratory_distress, hemodynamic_instability, coma, cardiac_arrest,
      severe_arrhythmia, severe_allergic_reaction, major_bleeding, urgency_level, created_at
    ) VALUES (
      ${caseId}, ${flags.convulsions ?? false}, ${flags.respiratory_distress ?? false}, ${flags.hemodynamic_instability ?? false}, ${flags.coma ?? false}, ${flags.cardiac_arrest ?? false},
      ${flags.severe_arrhythmia ?? false}, ${flags.severe_allergic_reaction ?? false}, ${flags.major_bleeding ?? false}, ${flags.urgency_level ?? null}, now()
    ) RETURNING id
  `
  return res[0].id
}

async function upsertRiskAssessment(caseId, assessment) {
  const existing = await sql`SELECT id FROM risk_assessments WHERE case_id = ${caseId} LIMIT 1`
  const findings = {
    findings: [
      { type: 'demo', severity: assessment.level, description: `Score de démonstration ${assessment.score}`, recommendation: 'Utiliser ce cas pour la simulation du moteur.' },
    ],
  }
  const recommendations = {
    recommendations: [
      { title: 'Suivi de démonstration', description: 'Cas démo prêt pour le sandbox.', priority: assessment.level === 'critical' ? 'high' : 'medium', action: 'Relancer une simulation avec les règles démo.' },
    ],
  }
  if (existing.length) {
    await sql`
      UPDATE risk_assessments SET
        risk_score = ${assessment.score},
        risk_level = ${assessment.level},
        findings = ${sql.json(findings)},
        recommendations = ${sql.json(recommendations)}
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }
  const res = await sql`
    INSERT INTO risk_assessments (case_id, risk_score, risk_level, findings, recommendations, created_at)
    VALUES (${caseId}, ${assessment.score}, ${assessment.level}, ${sql.json(findings)}, ${sql.json(recommendations)}, now()) RETURNING id
  `
  return res[0].id
}

async function run() {
  console.log('Seeding clinical demo coverage...')

  const medicationIds = new Map()
  for (const med of medications) {
    const id = await upsertMedication(med)
    medicationIds.set(med.name, id)
    console.log(`  - medication: ${med.name}`)
  }

  for (const interaction of interactions) {
    const [med1, med2] = interaction.pair
    const med1Id = medicationIds.get(med1)
    const med2Id = medicationIds.get(med2)
    if (!med1Id || !med2Id) continue
    await upsertInteraction(med1Id, med2Id, interaction)
    console.log(`  - interaction: ${med1} / ${med2}`)
  }

  for (const rule of clinicalRules) {
    await upsertRule(rule)
    console.log(`  - rule: ${rule.name}`)
  }

  const userId = await getSeedUserId()
  for (const patient of patients) {
    const patientId = await upsertPatient(patient)
    console.log(`  - patient: ${patient.medical_record_number}`)

    const conditions = patientConditions[patient.medical_record_number] || []
    for (const condition of conditions) {
      await upsertPatientCondition(patientId, condition)
    }

    const allergies = patientAllergies[patient.medical_record_number] || []
    for (const allergy of allergies) {
      await upsertPatientAllergy(patientId, allergy)
    }

    const lifestyle = patientLifestyle[patient.medical_record_number] || {}
    await upsertPatientLifestyle(patientId, lifestyle)

    const relatedCase = cases.find(item => item.patient_mrn === patient.medical_record_number)
    if (!relatedCase) continue

    const caseId = await upsertCase(userId, patientId, relatedCase)
    await clearCaseChildren(caseId)

    for (const med of relatedCase.medications) {
      const medicationId = medicationIds.get(med.name)
      if (!medicationId) continue
      await addCaseMedication(caseId, medicationId, med)
      await upsertPatientMedication(patientId, medicationId, med)
    }

    for (const symptom of relatedCase.symptoms) {
      await upsertCaseSymptom(caseId, { symptom_name: symptom, severity: 'moderate', duration: 'acute' })
    }

    await upsertCaseVitals(caseId, relatedCase.vitals)
    for (const lab of relatedCase.labs) {
      await upsertCaseLabResult(caseId, lab)
    }
    await upsertCaseEmergencyFlags(caseId, relatedCase.emergency_flags)
    await upsertRiskAssessment(caseId, relatedCase.risk_assessment)

    console.log(`  - case: ${relatedCase.case_type} for ${patient.medical_record_number} (age ${getPatientAge(patient.date_of_birth)})`)
  }

  console.log('\nDemo coverage seeded successfully.')
  console.log('Scenarios covered: CKD polypharmacy, pregnancy contraindication, pediatric overdose, emergency respiratory distress, toxicology, dosing adjustment.')
}

run()
  .catch((error) => {
    console.error('Failed to seed demo coverage:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end()
  })