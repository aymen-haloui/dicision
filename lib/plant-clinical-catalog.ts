export type PlantSeedRecord = {
  name: string
  commonName: string
  toxicParts: string
  toxicCompounds: string
  overdoseManagement: string
  toxicityData: Record<string, any>
}

export type PlantDrugInteractionSeedRule = {
  plantName: string
  medicationMatchers: string[]
  interactionType: string
  severity: 'critical' | 'high' | 'moderate' | 'low'
  description: string
  recommendation: string
  evidenceLevel: 'high' | 'moderate' | 'limited'
}

export const PLANT_SEED_DATA: PlantSeedRecord[] = [
  {
    name: 'Aloe vera',
    commonName: 'Aloe barbadensis Miller',
    toxicParts: 'Latex (suc) et feuille entiere si contamination en anthraquinones',
    toxicCompounds: 'Aloine, aloe-emodine, anthraquinones',
    overdoseManagement: 'Arret immediate, rehydratation, surveillance digestive/electrolytique et ECG si hypokaliemie',
    toxicityData: {
      botanical_family: 'Asphodelaceae',
      synonyms: ['aloe', 'aloe vera', 'aloe barbadensis'],
      preferred_therapeutic_part: 'gel interne (parenchyme)',
      risky_part: 'latex',
      key_active_compounds: ['acemannane', 'aloine', 'aloe-emodine'],
      pharmacology_focus: ['cicatrisation', 'anti-inflammatoire', 'digestif', 'hypoglycemiant modere'],
      major_risks: ['diarrhee', 'douleurs abdominales', 'hypokaliemie', 'hepatotoxicite rare'],
    },
  },
  {
    name: 'Ashwagandha',
    commonName: 'Withania somnifera',
    toxicParts: 'Feuilles (plus riches en composes potentiellement cytotoxiques)',
    toxicCompounds: 'Withanolides (dont withaferine A), alcaloides',
    overdoseManagement: 'Arret, surveillance neurologique/hepatique/endocrinienne, bilan thyroidien et hepatique si symptomes',
    toxicityData: {
      botanical_family: 'Solanaceae',
      synonyms: ['ashwagandha', 'withania', 'withania somnifera', 'ginseng indien'],
      preferred_therapeutic_part: 'racine',
      key_active_compounds: ['withanolides', 'sitoindosides', 'withaferine A'],
      pharmacology_focus: ['adaptogene', 'anxiolytique', 'immunomodulateur', 'hypoglycemiant modere'],
      major_risks: ['somnolence', 'troubles digestifs', 'hypotension', 'dysfonction thyroidienne', 'hepatotoxicite rare'],
    },
  },
  {
    name: 'Lavender',
    commonName: 'Lavandula angustifolia',
    toxicParts: 'Huile essentielle oxydee (peroxydes allergisants)',
    toxicCompounds: 'Linalol, acetate de linalyle, terpenes oxydes',
    overdoseManagement: 'Arret, surveillance neurologique/cardiorespiratoire, eviter alcool et autres depresseurs du SNC',
    toxicityData: {
      botanical_family: 'Lamiaceae',
      synonyms: ['lavender', 'lavande', 'lavandula angustifolia', 'lavande vraie'],
      preferred_therapeutic_part: 'sommites fleuries / huile essentielle standardisee',
      key_active_compounds: ['linalol', 'acetate de linalyle', 'terpinen-4-ol'],
      pharmacology_focus: ['anxiolytique', 'sedatif', 'hypotenseur leger', 'antiagregant leger'],
      major_risks: ['somnolence excessive', 'hypotension', 'irritation cutanee (huile oxydee)'],
    },
  },
  {
    name: 'Lemon balm',
    commonName: 'Melissa officinalis',
    toxicParts: 'Aucune partie majeure specifique, prudence avec huiles essentielles concentrees',
    toxicCompounds: 'Acide rosmarinique, neral, citronellol, beta-caryophyllene',
    overdoseManagement: 'Arret, surveillance neurologique et hemodynamique selon symptomatologie',
    toxicityData: {
      botanical_family: 'Lamiaceae',
      synonyms: ['lemon balm', 'melissa', 'melisse', 'melissa officinalis'],
      preferred_therapeutic_part: 'feuilles et sommites fleuries',
      key_active_compounds: ['acide rosmarinique', 'neral', 'citronellol'],
      pharmacology_focus: ['anxiolytique', 'sommeil', 'digestif antispasmodique', 'anti-inflammatoire'],
      major_risks: ['somnolence', 'hypotension legere', 'variabilite de composition'],
    },
  },
]

export const PLANT_DRUG_INTERACTION_SEED_RULES: PlantDrugInteractionSeedRule[] = [
  {
    plantName: 'Aloe vera',
    medicationMatchers: ['metformin', 'metformine', 'glibenclamide', 'gliclazide', 'glimepiride', 'insulin', 'insuline'],
    interactionType: 'pharmacodynamic',
    severity: 'critical',
    description: 'Risque d hypoglycemie additive (aloe + antidiabetique)',
    recommendation: 'Surveiller glycemie de facon rapprochee et ajuster la dose antidiabetique.',
    evidenceLevel: 'high',
  },
  {
    plantName: 'Aloe vera',
    medicationMatchers: ['furosemide', 'furosemide', 'hydrochlorothiazide', 'prednisone', 'digoxin', 'digoxine'],
    interactionType: 'electrolyte',
    severity: 'critical',
    description: 'Risque d hypokaliemie severe et toxicite cardiaque associee',
    recommendation: 'Eviter association avec latex d aloe, monitorer potassium et ECG.',
    evidenceLevel: 'high',
  },
  {
    plantName: 'Aloe vera',
    medicationMatchers: ['warfarin', 'warfarine', 'acenocoumarol', 'aspirin', 'aspirine', 'clopidogrel'],
    interactionType: 'bleeding',
    severity: 'high',
    description: 'Risque hemorragique potentiellement majore',
    recommendation: 'Surveiller INR/saignements, eviter en peri-operatoire.',
    evidenceLevel: 'moderate',
  },
  {
    plantName: 'Aloe vera',
    medicationMatchers: ['paracetamol', 'acetaminophen', 'atorvastatin', 'ketoconazole'],
    interactionType: 'hepatic',
    severity: 'moderate',
    description: 'Risque hepatique majore chez patient expose a aloe oral chronique',
    recommendation: 'Surveiller ASAT/ALAT et interrompre en cas de signes de cytolyse.',
    evidenceLevel: 'moderate',
  },
  {
    plantName: 'Ashwagandha',
    medicationMatchers: ['metformin', 'metformine', 'glibenclamide', 'gliclazide', 'glimepiride', 'insulin', 'insuline'],
    interactionType: 'pharmacodynamic',
    severity: 'high',
    description: 'Risque d hypoglycemie additive (ashwagandha + antidiabetique)',
    recommendation: 'Renforcer l auto-surveillance glycemique et ajuster les doses si besoin.',
    evidenceLevel: 'moderate',
  },
  {
    plantName: 'Ashwagandha',
    medicationMatchers: ['prednisone', 'prednisolone', 'tacrolimus', 'cyclosporine', 'mycophenolate'],
    interactionType: 'immunologic',
    severity: 'high',
    description: 'Effet immunomodulateur pouvant antagoniser une immunosuppression',
    recommendation: 'Eviter association non encadree, monitorer reponse clinique et biologique.',
    evidenceLevel: 'moderate',
  },
  {
    plantName: 'Ashwagandha',
    medicationMatchers: ['levothyroxine', 'liothyronine'],
    interactionType: 'endocrine',
    severity: 'high',
    description: 'Risque de thyrotoxicose (augmentation possible des hormones thyroidiennes)',
    recommendation: 'Surveiller TSH/T4 et adapter le traitement thyroidien.',
    evidenceLevel: 'moderate',
  },
  {
    plantName: 'Lavender',
    medicationMatchers: ['alprazolam', 'diazepam', 'zolpidem', 'fluoxetine', 'paroxetine', 'duloxetine', 'pregabalin'],
    interactionType: 'central_nervous_system',
    severity: 'critical',
    description: 'Potentialisation sedative (depression du SNC)',
    recommendation: 'Eviter co-administration ou reduire doses/surveiller vigilance.',
    evidenceLevel: 'high',
  },
  {
    plantName: 'Lavender',
    medicationMatchers: ['lisinopril', 'amlodipine', 'losartan', 'valsartan'],
    interactionType: 'hemodynamic',
    severity: 'high',
    description: 'Risque d hypotension additive',
    recommendation: 'Surveiller pression arterielle, vertiges et risque de chute.',
    evidenceLevel: 'moderate',
  },
  {
    plantName: 'Lavender',
    medicationMatchers: ['warfarin', 'warfarine', 'aspirin', 'aspirine', 'clopidogrel'],
    interactionType: 'bleeding',
    severity: 'moderate',
    description: 'Risque hemorragique faible a modere (effet antiagregant leger)',
    recommendation: 'Surveiller signes de saignement, prudence si INR deja eleve.',
    evidenceLevel: 'limited',
  },
  {
    plantName: 'Lemon balm',
    medicationMatchers: ['alprazolam', 'diazepam', 'zolpidem', 'pregabalin'],
    interactionType: 'central_nervous_system',
    severity: 'moderate',
    description: 'Somnolence additive possible (melisse + depresseurs du SNC)',
    recommendation: 'Commencer a faible dose, evaluer vigilance et risque de chute.',
    evidenceLevel: 'limited',
  },
  {
    plantName: 'Lemon balm',
    medicationMatchers: ['lisinopril', 'amlodipine', 'losartan', 'valsartan'],
    interactionType: 'hemodynamic',
    severity: 'moderate',
    description: 'Risque hypotensif additif possible',
    recommendation: 'Surveiller tension arterielle et symptomes orthostatiques.',
    evidenceLevel: 'limited',
  },
]