'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClinicalEngineResult, ClinicalContext } from '@/types/clinical-engine'
import { Alert, AlertDescription } from '@/components/ui/alert'

const defaultPatient: ClinicalContext = {
  patient: {
    id: 'test-patient-1',
    name: 'John Doe',
    age: 72,
    weight: 85,
    height: 180,
    gender: 'M',
  },
  labs: {
    potassium: { name: 'potassium', value: 6.8, unit: 'mEq/L', timestamp: new Date() },
    creatinine: { name: 'creatinine', value: 2.5, unit: 'mg/dL', timestamp: new Date() },
    eGFR: { name: 'eGFR', value: 25, unit: 'mL/min', timestamp: new Date() },
    spo2: { name: 'spo2', value: 88, unit: '%', timestamp: new Date() },
  },
  vitals: {
    heart_rate: 110,
    spo2: 84,
    heartRate: 110,
    blood_pressure_systolic: 160,
    blood_pressure_diastolic: 95,
    bloodPressure: { systolic: 160, diastolic: 95 },
    temperature: 37.2,
  },
  medications: [
    { id: 'med-1', name: 'Warfarin', category: 'ANTICOAGULANT', dose: '5mg', dosage: '5mg', frequency: 'daily', route: 'oral' },
    { id: 'med-2', name: 'Ibuprofen', category: 'NSAID', dose: '400mg', dosage: '400mg', frequency: 'tid', route: 'oral' },
    { id: 'med-3', name: 'Metformin', category: 'ANTIDIABETIC', dose: '1000mg', dosage: '1000mg', frequency: 'bid', route: 'oral' },
  ],
  symptoms: ['dizziness', 'shortness_of_breath'],
  allergies: [],
  conditions: ['diabetes', 'hypertension'],
  timestamp: new Date(),
}

export default function ClinicalSandboxPage() {
  const [patient, setPatient] = useState(defaultPatient)
  const [result, setResult] = useState<ClinicalEngineResult | null>(null)
  const [loading, setLoading] = useState(false)

  function scoreWidthClass(score: number) {
    if (score <= 0) return 'w-0'
    if (score <= 10) return 'w-1/12'
    if (score <= 20) return 'w-1/6'
    if (score <= 30) return 'w-1/4'
    if (score <= 40) return 'w-1/3'
    if (score <= 50) return 'w-1/2'
    if (score <= 60) return 'w-2/3'
    if (score <= 70) return 'w-3/4'
    if (score <= 80) return 'w-5/6'
    if (score <= 90) return 'w-11/12'
    return 'w-full'
  }

  async function simulate() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/clinical-rules/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const urgencyColors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800 border-green-300',
    MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bac d'essai décisionnel clinique</h1>
          <p className="text-slate-600">Tester les règles cliniques sur des scénarios patients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INPUT PANEL */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Données du patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Âge</label>
                  <input
                    type="number"
                    value={patient.patient.age ?? ''}
                    title="Age du patient"
                    placeholder="Âge"
                    onChange={(e) =>
                      setPatient({
                        ...patient,
                        patient: { ...patient.patient, age: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Potassium (mEq/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={patient.labs.potassium.value}
                    title="Potassium"
                    placeholder="Potassium"
                    onChange={(e) =>
                      setPatient({
                        ...patient,
                        labs: {
                          ...patient.labs,
                          potassium: { ...patient.labs.potassium, value: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">eGFR (mL/min)</label>
                  <input
                    type="number"
                    value={patient.labs.eGFR.value}
                    title="eGFR"
                    placeholder="eGFR"
                    onChange={(e) =>
                      setPatient({
                        ...patient,
                        labs: { ...patient.labs, eGFR: { ...patient.labs.eGFR, value: Number(e.target.value) } },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={patient.vitals.spo2}
                    title="SpO2"
                    placeholder="SpO2"
                    onChange={(e) =>
                      setPatient({
                        ...patient,
                        vitals: { ...patient.vitals, spo2: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Médicaments</label>
                  <div className="space-y-2 text-sm">
                    {patient.medications.map((med, i) => (
                      <div key={i} className="flex items-center">
                        <input type="checkbox" defaultChecked title={`Sélectionner le médicament ${med.name}`} className="mr-2" />
                        <span className="text-slate-700">{med.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={simulate} disabled={loading} className="w-full">
                  {loading ? "Évaluation en cours..." : "Évaluer les règles"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RESULTS PANEL */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                {/* SUMMARY CARD */}
                <Card className={`border-2 ${urgencyColors[result.urgency_level] || ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Résultat de l'évaluation</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">{result.summary}</p>
                      </div>
                      <div className="text-right">
                        <div className={`px-4 py-2 rounded-lg font-bold ${urgencyColors[result.urgency_level]}`}>
                          {result.urgency_level}
                        </div>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{result.total_risk_score.toFixed(1)}</p>
                        <p className="text-xs text-slate-600">Score de risque</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* RISK SCORES BREAKDOWN */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Détail du score de risque</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(result.risk_scores).map(([category, score]) => (
                        <div key={category}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700 capitalize">{category}</span>
                            <span className="text-sm font-bold text-slate-900">{(score as number).toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`bg-blue-500 h-2 rounded-full ${scoreWidthClass(Number(score))}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* TRIGGERED RULES */}
                {result.triggered_rules.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Triggered Rules ({result.triggered_rules.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.triggered_rules.map((rule, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-900">{rule.rule_name}</h4>
                              <p className="text-xs text-slate-600 mt-1">{rule.explanation}</p>
                            </div>
                            <div className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-700">
                              Priority {rule.priority}
                            </div>
                          </div>
                          {rule.outputs_applied?.recommendations && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-xs font-medium text-slate-700 mb-2">Recommendations:</p>
                              <ul className="text-xs text-slate-600 space-y-1">
                                {rule.outputs_applied.recommendations.slice(0, 3).map((rec, j) => (
                                  <li key={j} className="ml-2">• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* ALERTS */}
                {result.alerts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Alerts ({result.alerts.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.alerts.map((alert, i) => (
                        <Alert key={i} className="border-red-300 bg-red-50">
                          <AlertDescription className="text-red-800 text-sm">
                            <span className="font-bold">{alert.type.toUpperCase()}:</span> {alert.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* CONTRAINDICATIONS */}
                {result.contraindications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Contraindications ({result.contraindications.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.contraindications.map((contra, i) => (
                        <Alert key={i} className="border-orange-300 bg-orange-50">
                          <AlertDescription className="text-orange-800 text-sm">
                            <span className="font-bold">{contra.target}:</span> {contra.reason}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* RECOMMENDATIONS */}
                {result.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">All Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal list-inside space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-slate-700">
                            {rec}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-8 text-center text-slate-500">
                  <p>Click "Evaluate Rules" to test the engine</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
