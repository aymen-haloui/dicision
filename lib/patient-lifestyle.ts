export function parseBool(value: unknown, defaultValue = false): boolean {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return defaultValue
}

export function buildLifestylePayload(body: Record<string, unknown>) {
  const treatmentTypes = body.special_treatment_types
  const treatmentStr = Array.isArray(treatmentTypes)
    ? treatmentTypes.join(',')
    : typeof treatmentTypes === 'string'
      ? treatmentTypes
      : null

  return {
    substance_use: parseBool(body.substance_use),
    substance_type: (body.substance_type as string) || null,
    substance_frequency: (body.substance_frequency as string) || null,
    substance_route: (body.substance_route as string) || null,
    substance_duration: (body.substance_duration as string) || null,
    substance_last_use: (body.substance_last_use as string) || null,
    substance_withdrawal_signs: parseBool(body.substance_withdrawal_signs),
    smoking_details: (body.smoking_details as string) || null,
    alcohol_details: (body.alcohol_details as string) || null,
    toxic_exposure: parseBool(body.toxic_exposure),
    toxic_exposure_details: (body.toxic_exposure_details as string) || null,
    prolonged_fasting: parseBool(body.prolonged_fasting),
    fasting_type: (body.fasting_type as string) || null,
    fasting_frequency: (body.fasting_frequency as string) || null,
    fasting_symptoms: (body.fasting_symptoms as string) || null,
    night_shift: parseBool(body.night_shift),
    night_shift_details: (body.night_shift_details as string) || null,
    physical_activity_details: (body.physical_activity_details as string) || null,
    diet_details: (body.diet_details as string) || null,
    hydration_notes: (body.hydration_notes as string) || null,
    stress_details: (body.stress_details as string) || null,
    sleep_details: (body.sleep_details as string) || null,
    special_condition_type: (body.special_condition_type as string) || null,
    special_diagnosis: (body.special_diagnosis as string) || null,
    special_stage_classification: (body.special_stage_classification as string) || null,
    special_active_disease: parseBool(body.special_active_disease),
    special_treatment_types: treatmentStr,
    diet_type: (body.diet_type as string) || null,
    sleep_hours: body.sleep_hours ? parseFloat(String(body.sleep_hours)) : null,
    sun_exposure: (body.sun_exposure as string) || null,
    sun_exposure_details: (body.sun_exposure_details as string) || null,
    restrictive_diet: parseBool(body.restrictive_diet),
    restrictive_diet_details: (body.restrictive_diet_details as string) || null,
    uncontrolled_natural_products: parseBool(body.uncontrolled_natural_products),
    natural_products_details: (body.natural_products_details as string) || null,
    blood_donor: parseBool(body.blood_donor),
    blood_donation_details: (body.blood_donation_details as string) || null,
    immunodepression: (body.immunodepression as string) || null,
    sudden_medication_stop: parseBool(body.sudden_medication_stop),
    sudden_medication_stop_details: (body.sudden_medication_stop_details as string) || null,
    regular_checkup: body.regular_checkup === false || body.regular_checkup === 'false' ? false : true,
    medical_followup_status: (body.medical_followup_status as string) || null,
    last_consultation: (body.last_consultation as string) || null,
    self_diagnosis: parseBool(body.self_diagnosis),
    self_diagnosis_treatments: (body.self_diagnosis_treatments as string) || null,
    housing_conditions: (body.housing_conditions as string) || null,
    hidden_self_medication: parseBool(body.hidden_self_medication),
    hidden_self_medication_details: (body.hidden_self_medication_details as string) || null,
    phytotherapy_details: (body.phytotherapy_details as string) || null,
    previous_intoxication: parseBool(body.previous_intoxication),
  }
}

export function hasLifestyleData(body: Record<string, unknown>): boolean {
  return Boolean(
      body.substance_use ||
      body.toxic_exposure ||
      body.prolonged_fasting ||
      body.night_shift ||
      body.special_condition_type ||
      body.special_diagnosis ||
      body.sleep_hours ||
      body.diet_type ||
      body.housing_conditions ||
      body.smoking_details ||
      body.alcohol_details ||
      body.physical_activity_details ||
      body.diet_details ||
      body.hydration_notes ||
      body.stress_details ||
      body.sleep_details ||
      body.sun_exposure ||
      body.restrictive_diet ||
      body.uncontrolled_natural_products ||
      body.blood_donor ||
      body.sudden_medication_stop ||
      body.regular_checkup === false ||
      body.regular_checkup === 'false' ||
      body.medical_followup_status ||
      body.last_consultation ||
      body.self_diagnosis ||
      body.hidden_self_medication ||
      body.phytotherapy_details ||
      body.previous_intoxication
  )
}
