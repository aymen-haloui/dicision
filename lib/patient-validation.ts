export interface PatientFormValidationInput {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  weight: string
  height: string
}

export function validatePatientProfile(data: PatientFormValidationInput): string | null {
  const first = data.first_name?.trim() ?? ''
  const last = data.last_name?.trim() ?? ''

  if (first.length < 2 || first.length > 100) {
    return 'Le prénom doit contenir entre 2 et 100 caractères.'
  }
  if (last.length < 2 || last.length > 100) {
    return 'Le nom doit contenir entre 2 et 100 caractères.'
  }
  if (!data.date_of_birth) {
    return 'La date de naissance est obligatoire.'
  }
  if (!data.gender) {
    return 'Le sexe est obligatoire.'
  }

  if (data.weight) {
    const w = parseFloat(data.weight)
    if (isNaN(w) || w < 0 || w > 500) {
      return 'Le poids doit être entre 0 et 500 kg.'
    }
  }

  if (data.height) {
    const h = parseFloat(data.height)
    if (isNaN(h) || h < 20 || h > 300) {
      return 'La taille doit être entre 20 et 300 cm.'
    }
  }

  return null
}

export function computeAge(dateOfBirth: string): string | null {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  if (age < 0) return null

  if (age === 0) {
    let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth()
    if (today.getDate() < birth.getDate()) months--
    return `${Math.max(months, 0)} mois`
  }

  return `${age} ans`
}

export const FEMALE_GENDER = 'FEMALE'
