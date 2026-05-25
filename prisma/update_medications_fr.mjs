import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

const __dirname = dirname(fileURLToPath(import.meta.url))
for (const envPath of [resolve(__dirname, '../.env'), resolve(__dirname, '../.env.local')]) {
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
if (!connectionString) throw new Error('DATABASE_URL manquante')

const requiresSsl = process.env.DB_SSL === 'true' || connectionString.includes('.neon.tech') || /sslmode=require/i.test(connectionString)
const sql = postgres(connectionString, { ssl: requiresSsl })

const ibuprofenContraindications = [
  { condition: 'Allergie_ou_asthme_declenche_par_AINS_ou_aspirine', severity: 'critical' },
  { condition: 'Antecedent_saignement_digestif_sous_AINS', severity: 'critical' },
  { condition: 'Ulcere_gastroduodenal_en_cours_ou_recidivant', severity: 'critical' },
  { condition: 'Hemorragie_digestive_cerebrale_ou_autre', severity: 'critical' },
  { condition: 'Insuffisance_hepatique_grave', severity: 'critical' },
  { condition: 'Insuffisance_renale_grave', severity: 'critical' },
  { condition: 'Insuffisance_cardiaque_grave', severity: 'critical' },
  { condition: 'Lupus_erythemateux_dissemine', severity: 'moderate' },
  { condition: 'Enfant_moins_de_6_ans_selon_forme', severity: 'critical' },
  { condition: 'Grossesse_a_partir_du_6e_mois', severity: 'critical' },
  { condition: 'Allaitement', severity: 'moderate' }
]

const ibuprofenPharma = {
  substance_name: 'Ibuprofene',
  mechanism: "AINS (derive de l'acide arylcarboxylique, groupe des propioniques) inhibant les cyclo-oxygenases avec effet antalgique, antipyretique, anti-inflammatoire et inhibition plaquettaire transitoire.",
  available_forms: [
    'Comprimes pellicules 200 mg',
    'Comprimes pellicules 400 mg',
    'Suspension buvable enfant/nourrisson 20 mg/ml'
  ],
  administration_routes: ['Orale (comprime, suspension)'],
  action_speed: 'Relativement rapide',
  action_duration: 'Courte a moyenne selon dose et forme',
  common_indications: [
    'Fievre et douleurs de courte duree (maux de tete, douleurs dentaires, etats grippaux, courbatures, dysmenorrhee)',
    'Poussees inflammatoires d arthrose',
    'Arthrites, tendinites, lombalgies, sciatiques',
    'Douleurs post-traumatiques de l appareil locomoteur',
    'Arthrite chronique juvenile (forme pediatrique)'
  ],
  dosing: {
    adults: [
      '200 mg: adulte et enfant >30 kg: 1 a 2 comprimes toutes les 6h, max 6 comprimes/jour',
      '400 mg: douleur/fievre: 1 comprime, renouvelable apres 6h, max 3 comprimes/jour',
      '400 mg: dysmenorrhee: 1 comprime, max 4 comprimes/jour',
      '400 mg rhumatologie attaque: 2 comprimes 3 fois/jour',
      '400 mg rhumatologie entretien: 1 comprime 3 a 4 fois/jour'
    ],
    children: [
      '200 mg: 20-30 kg: 1 comprime toutes les 6h, max 3 comprimes/jour',
      '20 mg/ml (3 mois a 12 ans): douleur/fievre 20-30 mg/kg/j en 3 prises (max 30 mg/kg/j)',
      '20 mg/ml: arthrite juvenile 30-40 mg/kg/j en 4 prises'
    ],
    renal_adjustment: [
      'Eviter en insuffisance renale severe',
      'Surveillance renale en traitements prolonges'
    ]
  },
  adverse_effects: [
    { system: 'Digestif', effect: 'Nausees, vomissements, gastrite', frequency: 'Frequent', severity: 'moderate', action: 'Prise au milieu des repas, surveillance' },
    { system: 'Digestif', effect: 'Ulcere/Hemorragie digestive', frequency: 'Rare', severity: 'critical', action: 'Arret et prise en charge urgente' },
    { system: 'Immuno-allergique', effect: 'Eruption, oedeme, crise d asthme, hypotension', frequency: 'Rare', severity: 'critical', action: 'Arret immediat et urgence' },
    { system: 'Neurologique', effect: 'Vertiges, cephalees', frequency: 'Frequent', severity: 'mild', action: 'Surveillance' },
    { system: 'Hepatique/Hematologique', effect: 'Transaminases elevees, anomalies NFS', frequency: 'Rare', severity: 'moderate', action: 'Bilan biologique' }
  ],
  drug_interactions: [
    { substance: 'Aspirine et autres AINS', mechanism: 'Potentialisation des effets indesirables', severity: 'high' },
    { substance: 'Warfarine/AVK', mechanism: 'Risque hemorragique majore', severity: 'critical' },
    { substance: 'Antiagregants (clopidogrel...)', mechanism: 'Risque hemorragique majore', severity: 'high' },
    { substance: 'Lithium', mechanism: 'Augmentation de la lithiemie', severity: 'high' },
    { substance: 'Methotrexate', mechanism: 'Augmentation de la toxicite', severity: 'critical' }
  ],
  overdose: {
    max_daily_dose: '3200 mg/jour',
    toxicity_thresholds: {
      child_low_risk: '<100 mg/kg (symptomes peu probables)',
      child_severe: '>400 mg/kg (toxicite severe possible)',
      adult: 'Pas de seuil unique fiable'
    },
    symptoms: {
      mild: ['Douleurs abdominales', 'Nausees', 'Vomissements', 'Somnolence', 'Cephalees', 'Acouphenes', 'Ataxie'],
      moderate: ['Vomissements persistants', 'Confusion legere', 'Tachycardie', 'Deshydratation'],
      severe: ['Hemorragie digestive', 'Hypotension', 'Hypothermie', 'Acidose metabolique', 'Convulsions', 'IRA', 'Coma', 'Detresse respiratoire']
    },
    management_by_severity: [
      'Leger: charbon actif precoce (<1-2h si dose toxique), traitement symptomatique, surveillance',
      'Modere: hydratation IV, correction hydro-electrolytique, bilan renal/ionogramme/GDS, surveillance rapprochee',
      'Severe: reanimation (O2, intubation si besoin, remplissage, vasopresseurs, benzodiazepines si convulsions)',
      'Severe avec atteinte renale: CRRT/hemodialyse pour correction metabolique et soutien hemodynamique',
      'Severe avec choc multivisceral: support avance de reanimation, SPAD selon disponibilite'
    ],
    key_point: 'L acidose metabolique est un signe de gravite majeur'
  }
}

const amoxicillinContraindications = [
  { condition: 'Hypersensibilite_aux_betalactamines', severity: 'critical' },
  { condition: 'Hypersensibilite_aux_cephalosporines', severity: 'critical' },
  { condition: 'Hypersensibilite_aux_penicillines', severity: 'critical' },
  { condition: 'Mononucleose_infectieuse', severity: 'moderate' },
  { condition: 'Insuffisance_renale', severity: 'moderate' },
  { condition: 'Insuffisance_hepatique', severity: 'moderate' },
  { condition: 'Epilepsie_ou_risque_convulsif', severity: 'moderate' },
  { condition: 'Patient_dialyse_peritoneale_ou_hemodialyse', severity: 'moderate' },
  { condition: 'Oligurie', severity: 'moderate' },
  { condition: 'Pathologie_meningee', severity: 'moderate' },
  { condition: 'Sonde_vesicale', severity: 'moderate' },
  { condition: 'Traitement_prolonge_ou_haute_posologie', severity: 'moderate' },
  { condition: 'Terrain_allergique', severity: 'moderate' },
  { condition: 'Maladie_de_Lyme', severity: 'moderate' }
]

const amoxicillinPharma = {
  substance_name: 'Amoxicilline',
  mechanism: 'Antibiotique betalactamine (aminopenicilline) inhibant la synthese de la paroi bacterienne via les PBP; activite bactericide temps-dependante.',
  available_forms: [
    'Comprimes 500 mg et 1 g',
    'Gelules 250 mg et 500 mg',
    'Suspensions buvables pediatriques',
    'Sachets dispersibles',
    'Formes injectables hospitalieres',
    'Associations amoxicilline/acide clavulanique'
  ],
  administration_routes: ['Orale', 'Intraveineuse'],
  action_speed: 'Relativement rapide',
  action_duration: 'Courte; necessite 2 a 3 prises/j selon indication',
  common_indications: [
    'Abces dentaire avec cellulite',
    'Angine streptococcique',
    'Bacteriurie asymptomatique gravidique',
    'Cystite aigue',
    'Pyelonephrite aigue',
    'Otite moyenne aigue',
    'Sinusite bacterienne aigue',
    'Pneumopathie aigue',
    'Endocardite bacterienne (prophylaxie/prise en charge selon contexte)',
    'Eradication Helicobacter pylori',
    'Fievres typhoide et paratyphoide',
    'Maladie de Lyme'
  ],
  dosing: {
    adults: [
      'Sinusite bacterienne aigue: 250-500 mg toutes les 8h ou 750 mg-1 g toutes les 12h',
      'Infections severes: 750 mg-1 g toutes les 8h pendant 10 jours',
      'Otite/abces dentaire/pyelonephrite/bacteriurie gravidique: 500 mg toutes les 8h ou 750 mg-1 g toutes les 12h',
      'Angine/BPCO exacerbee/Pneumonie communautaire: 500 mg-1 g toutes les 8h',
      'Typhoide/paratyphoide: 500 mg-2 g toutes les 8h',
      'Infection articulaire sur prothese: 500 mg-1 g toutes les 8h',
      'Prophylaxie endocardite: 2 g dose unique 30-60 min avant intervention',
      'H. pylori: 750 mg-1 g 2 fois/j avec IPP + autre antibiotique pendant 7 jours',
      'Lyme precoce: 500 mg-1 g toutes les 8h (max 4 g/j) 10-21 jours',
      'Lyme tardive: 500 mg-2 g toutes les 8h (max 6 g/j) 10-30 jours'
    ],
    children: [
      'Sinusite/otite/pneumonie/pyelonephrite/abces dentaire: 20-90 mg/kg/j en prises fractionnees',
      'Angine streptococcique: 40-90 mg/kg/j en prises fractionnees',
      'Typhoide/paratyphoide: 100 mg/kg/j en 3 prises',
      'Prophylaxie endocardite: 50 mg/kg dose unique 30-60 min avant intervention',
      'Lyme precoce: 25-50 mg/kg/j en 3 prises pendant 10-21 jours',
      'Lyme tardive: 100 mg/kg/j en 3 prises pendant 10-30 jours'
    ],
    hemodialysis: [
      '>=40 kg: 500 mg toutes les 24h + 500 mg avant et apres hemodialyse',
      '<40 kg: 15 mg/kg/j (max 500 mg) + 15 mg/kg avant et apres hemodialyse'
    ],
    renal_adjustment: [
      'Ajuster selon fonction renale',
      'Surveillance de la fonction renale et hydro-electrolytique'
    ]
  },
  adverse_effects: [
    { system: 'Digestif', effect: 'Diarrhee, nausees, vomissements', frequency: 'Frequent', severity: 'mild', action: 'Hydratation, prise au repas, surveillance' },
    { system: 'Digestif', effect: 'Colite a Clostridioides difficile', frequency: 'Rare', severity: 'critical', action: 'Arret immediat et prise en charge urgente' },
    { system: 'Cutane', effect: 'Eruption, urticaire, prurit', frequency: 'Frequent/Peu frequent', severity: 'moderate', action: 'Surveillance ou arret selon gravite' },
    { system: 'Cutane', effect: 'Syndrome de Stevens-Johnson/Lyell', frequency: 'Tres rare', severity: 'critical', action: 'Hospitalisation urgente' },
    { system: 'Hepatique', effect: 'Hepatite, ictere cholestatique', frequency: 'Tres rare', severity: 'critical', action: 'Arret et prise en charge' },
    { system: 'Neurologique', effect: 'Cephalees, vertiges', frequency: 'Peu frequent', severity: 'mild', action: 'Surveillance' },
    { system: 'Neurologique', effect: 'Convulsions', frequency: 'Tres rare', severity: 'critical', action: 'Urgence medicale' }
  ],
  drug_interactions: [
    { substance: 'Probenecide', mechanism: 'Blocage elimination renale amoxicilline', severity: 'moderate', recommendation: 'Association deconseillee, ajuster si necessaire' },
    { substance: 'Allopurinol', mechanism: 'Risque accru d eruption cutanee', severity: 'moderate', recommendation: 'Eviter association, surveiller peau' },
    { substance: 'Tetracyclines', mechanism: 'Antagonisme pharmacodynamique', severity: 'moderate', recommendation: 'Eviter association' },
    { substance: 'AVK (warfarine, acenocoumarol)', mechanism: 'Augmentation INR via flore intestinale/vitamine K', severity: 'high', recommendation: 'Adapter AVK, surveiller INR/TP' },
    { substance: 'Methotrexate', mechanism: 'Diminution elimination renale MTX', severity: 'critical', recommendation: 'Eviter association, surveiller NFS/fonction renale' }
  ],
  overdose: {
    antidote: 'Aucun antidote specifique',
    symptoms: {
      mild: ['Nausees', 'Vomissements', 'Douleurs abdominales', 'Somnolence legere', 'Confusion legere'],
      moderate: ['Troubles digestifs persistants', 'Troubles neuro-psychiques', 'Debut de desordres hydro-electrolytiques'],
      severe: ['Insuffisance renale aigue', 'Néphrotoxicite', 'Cristallurie', 'Troubles hydro-electrolytiques importants', 'Alteration de la conscience']
    },
    management_by_severity: [
      'Traitement symptomatique et surveillance hydro-electrolytique',
      'Charbon actif precoce selon contexte',
      'Hemodialyse possible dans les formes severes'
    ]
  }
}

async function updateMedicationByName(name, payload) {
  const result = await sql`
    UPDATE medications
    SET
      generic_name = ${payload.generic_name},
      category = ${payload.category},
      dosage_form = ${payload.dosage_form},
      default_dosage = ${payload.default_dosage},
      warnings = ${payload.warnings},
      max_daily_dose_adult = ${payload.max_daily_dose_adult},
      max_daily_dose_child = ${payload.max_daily_dose_child},
      contraindications = ${sql.json(payload.contraindications)},
      pharmacological_data = ${sql.json(payload.pharmacological_data)}
    WHERE name = ${name}
    RETURNING id, name
  `
  if (!result.length) throw new Error(`Medication not found: ${name}`)
  return result[0]
}

async function run() {
  const ibu = await updateMedicationByName('Ibuprofen', {
    generic_name: 'Ibuprofene',
    category: 'AINS',
    dosage_form: 'Comprime 200/400 mg, suspension buvable 20 mg/ml',
    default_dosage: '200-400 mg par prise, espacer de 6h',
    warnings: 'Eviter en cas de saignement digestif, prudence avec anticoagulants, contre-indique a partir du 6e mois de grossesse.',
    max_daily_dose_adult: 3200,
    max_daily_dose_child: 30,
    contraindications: ibuprofenContraindications,
    pharmacological_data: ibuprofenPharma,
  })

  const amox = await updateMedicationByName('Amoxicillin', {
    generic_name: 'Amoxicilline',
    category: 'Antibiotique - Betalactamine',
    dosage_form: 'Comprime/gelule/suspension, injectable',
    default_dosage: '250 mg a 1 g selon indication, 2 a 3 prises/jour',
    warnings: 'Risque d hypersensibilite; ajuster en insuffisance renale; surveiller en traitement prolonge.',
    max_daily_dose_adult: 6000,
    max_daily_dose_child: 100,
    contraindications: amoxicillinContraindications,
    pharmacological_data: amoxicillinPharma,
  })

  const interaction = await sql`
    UPDATE interactions
    SET
      interaction_type = 'Interaction medicamenteuse',
      severity = 'MODERATE',
      description = 'Association AINS + certains antibiotiques: possible majoration des effets digestifs et du risque hemorragique selon le contexte clinique.',
      recommendation = 'Utiliser avec prudence; surveiller signes digestifs et saignement, surtout chez les patients a haut risque.'
    WHERE (medication_id_1 = ${ibu.id} AND medication_id_2 = ${amox.id})
       OR (medication_id_1 = ${amox.id} AND medication_id_2 = ${ibu.id})
    RETURNING id
  `

  console.log('Ibuprofen updated:', ibu)
  console.log('Amoxicillin updated:', amox)
  console.log('Interaction updated:', interaction[0] ?? null)

  const check = await sql`
    SELECT name, category, default_dosage, jsonb_array_length(contraindications::jsonb) AS ci_count
    FROM medications
    WHERE id IN (${ibu.id}, ${amox.id})
    ORDER BY name
  `
  console.log('Check summary:', check)
}

run()
  .catch((err) => {
    console.error('Update failed:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end()
  })
