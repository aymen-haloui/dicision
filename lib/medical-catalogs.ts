export interface CatalogItem {
  value: string
  label: string
  category?: string
}

/** Chronic disease catalog (ICD-10 inspired labels for CDSS baseline profile) */
export const DISEASE_CATALOG: CatalogItem[] = [
  { value: 'Hypertension', label: 'Hypertension', category: 'CARDIOVASCULAR' },
  { value: 'Type 2 Diabetes', label: 'Type 2 Diabetes', category: 'ENDOCRINE' },
  { value: 'Type 1 Diabetes', label: 'Type 1 Diabetes', category: 'ENDOCRINE' },
  { value: 'Asthma', label: 'Asthma', category: 'RESPIRATORY' },
  { value: 'COPD', label: 'COPD', category: 'RESPIRATORY' },
  { value: 'Chronic Kidney Disease', label: 'Chronic Kidney Disease', category: 'RENAL' },
  { value: 'Heart Failure', label: 'Heart Failure', category: 'CARDIOVASCULAR' },
  { value: 'Atrial Fibrillation', label: 'Atrial Fibrillation', category: 'CARDIOVASCULAR' },
  { value: 'Epilepsy', label: 'Epilepsy', category: 'NEUROLOGICAL' },
  { value: 'Parkinson Disease', label: 'Parkinson Disease', category: 'NEUROLOGICAL' },
  { value: 'Rheumatoid Arthritis', label: 'Rheumatoid Arthritis', category: 'AUTOIMMUNE' },
  { value: 'Systemic Lupus Erythematosus', label: 'Systemic Lupus Erythematosus', category: 'AUTOIMMUNE' },
  { value: 'Hepatitis C', label: 'Hepatitis C', category: 'HEPATIC' },
  { value: 'Cirrhosis', label: 'Cirrhosis', category: 'HEPATIC' },
  { value: 'Major Depression', label: 'Major Depression', category: 'PSYCHIATRIC' },
  { value: 'Breast Cancer', label: 'Breast Cancer', category: 'ONCOLOGICAL' },
  { value: 'Colorectal Cancer', label: 'Colorectal Cancer', category: 'ONCOLOGICAL' },
]

export const ALLERGEN_CATALOG: CatalogItem[] = [
  { value: 'Penicillin', label: 'Penicillin', category: 'DRUG' },
  { value: 'Amoxicillin', label: 'Amoxicillin', category: 'DRUG' },
  { value: 'Aspirin', label: 'Aspirin', category: 'DRUG' },
  { value: 'Ibuprofen', label: 'Ibuprofen', category: 'DRUG' },
  { value: 'Sulfonamides', label: 'Sulfonamides', category: 'DRUG' },
  { value: 'Peanut', label: 'Peanut', category: 'FOOD' },
  { value: 'Shellfish', label: 'Shellfish', category: 'FOOD' },
  { value: 'Egg', label: 'Egg', category: 'FOOD' },
  { value: 'Latex', label: 'Latex', category: 'CUTANEOUS' },
  { value: 'Dust mites', label: 'Dust mites', category: 'RESPIRATORY' },
  { value: 'Pollen', label: 'Pollen', category: 'RESPIRATORY' },
  { value: 'Bee venom', label: 'Bee venom', category: 'INSECT' },
  { value: 'Cat dander', label: 'Cat dander', category: 'ANIMAL' },
]

export const SPECIAL_DIAGNOSIS_CATALOG: CatalogItem[] = [
  { value: 'Breast cancer', label: 'Breast cancer' },
  { value: 'Glioblastoma', label: 'Glioblastoma' },
  { value: 'Leukemia', label: 'Leukemia' },
  { value: 'Lung cancer', label: 'Lung cancer' },
  { value: 'Lymphoma', label: 'Lymphoma' },
  { value: 'Melanoma', label: 'Melanoma' },
]

export function getDiseaseCategory(name: string): string {
  return DISEASE_CATALOG.find(d => d.value === name)?.category ?? ''
}

export function getAllergenCategory(name: string): string {
  return ALLERGEN_CATALOG.find(a => a.value === name)?.category ?? ''
}
