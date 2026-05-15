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
    prolonged_fasting: parseBool(body.prolonged_fasting),
    fasting_type: (body.fasting_type as string) || null,
    fasting_frequency: (body.fasting_frequency as string) || null,
    night_shift: parseBool(body.night_shift),
    special_condition_type: (body.special_condition_type as string) || null,
    special_diagnosis: (body.special_diagnosis as string) || null,
    special_stage_classification: (body.special_stage_classification as string) || null,
    special_active_disease: parseBool(body.special_active_disease),
    special_treatment_types: treatmentStr,
    diet_type: (body.diet_type as string) || null,
    sleep_hours: body.sleep_hours ? parseFloat(String(body.sleep_hours)) : null,
    sun_exposure: (body.sun_exposure as string) || null,
    restrictive_diet: parseBool(body.restrictive_diet),
    uncontrolled_natural_products: parseBool(body.uncontrolled_natural_products),
    blood_donor: parseBool(body.blood_donor),
    immunodepression: (body.immunodepression as string) || null,
    sudden_medication_stop: parseBool(body.sudden_medication_stop),
    regular_checkup: body.regular_checkup === false || body.regular_checkup === 'false' ? false : true,
    self_diagnosis: parseBool(body.self_diagnosis),
    housing_conditions: (body.housing_conditions as string) || null,
    previous_intoxication: parseBool(body.previous_intoxication),
  }
}

export function hasLifestyleData(body: Record<string, unknown>): boolean {
  return Boolean(
    body.substance_use ||
      body.prolonged_fasting ||
      body.night_shift ||
      body.special_condition_type ||
      body.special_diagnosis ||
      body.sleep_hours ||
      body.diet_type ||
      body.housing_conditions ||
      body.previous_intoxication
  )
}
