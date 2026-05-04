'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface Medication {
  id: string
  name: string
  generic_name: string
  category: string
  default_dosage: string
}

export default function CaseForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatientId = searchParams.get('patientId')

  const [patients, setPatients] = useState<Patient[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || '',
    caseType: 'clinical' as 'emergency' | 'clinical',
    chiefComplaint: '',
    symptoms: '',
    vitalSigns: {
      heartRate: '',
      bloodPressure: '',
      temperature: '',
      respiratoryRate: '',
    },
  })

  const [selectedMedications, setSelectedMedications] = useState<
    Array<{
      medicationId: string
      dosage: string
      frequency: string
      duration: string
      route: string
    }>
  >([])

  useEffect(() => {
    async function loadData() {
      try {
        const [patientsRes, medicationsRes] = await Promise.all([
          fetch('/api/patients/list'),
          fetch('/api/medications'),
        ])

        if (patientsRes.ok) {
          const patientsData = await patientsRes.json()
          setPatients(patientsData)
        }

        if (medicationsRes.ok) {
          const medicationsData = await medicationsRes.json()
          setMedications(medicationsData)
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    if (name.startsWith('vital_')) {
      const vitalKey = name.replace('vital_', '')
      setFormData((prev) => ({
        ...prev,
        vitalSigns: {
          ...prev.vitalSigns,
          [vitalKey]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleAddMedication = () => {
    setSelectedMedications((prev) => [
      ...prev,
      {
        medicationId: '',
        dosage: '',
        frequency: '',
        duration: '',
        route: '',
      },
    ])
  }

  const handleRemoveMedication = (index: number) => {
    setSelectedMedications((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMedicationChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setSelectedMedications((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!formData.patientId) {
        setError('Please select a patient')
        setIsLoading(false)
        return
      }

      if (!formData.chiefComplaint) {
        setError('Chief complaint is required')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          caseType: formData.caseType,
          chiefComplaint: formData.chiefComplaint,
          symptoms: formData.symptoms,
          vitalSigns: formData.vitalSigns,
          medications: selectedMedications,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create case')
        setIsLoading(false)
        return
      }

      const data = await response.json()
      router.push(`/dashboard/cases/${data.id}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Case Information</h2>

          <div>
            <Label htmlFor="patientId" className="text-sm font-medium text-slate-900 mb-2 block">
              Patient *
            </Label>
            <select
              id="patientId"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="caseType" className="text-sm font-medium text-slate-900 mb-2 block">
              Case Type *
            </Label>
            <select
              id="caseType"
              name="caseType"
              value={formData.caseType}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="clinical">Clinical</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div>
            <Label htmlFor="chiefComplaint" className="text-sm font-medium text-slate-900 mb-2 block">
              Chief Complaint *
            </Label>
            <textarea
              id="chiefComplaint"
              name="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={handleChange}
              placeholder="Describe the patient's main complaint..."
              rows={4}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="symptoms" className="text-sm font-medium text-slate-900 mb-2 block">
              Symptoms
            </Label>
            <textarea
              id="symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="List associated symptoms..."
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-4">Vital Signs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-900 mb-2 block">
                  Heart Rate (bpm)
                </Label>
                <Input
                  type="number"
                  name="vital_heartRate"
                  value={formData.vitalSigns.heartRate}
                  onChange={handleChange}
                  placeholder="70"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-900 mb-2 block">
                  Blood Pressure
                </Label>
                <Input
                  type="text"
                  name="vital_bloodPressure"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={handleChange}
                  placeholder="120/80"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-900 mb-2 block">
                  Temperature (°C)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  name="vital_temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={handleChange}
                  placeholder="36.5"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-900 mb-2 block">
                  Respiratory Rate (breaths/min)
                </Label>
                <Input
                  type="number"
                  name="vital_respiratoryRate"
                  value={formData.vitalSigns.respiratoryRate}
                  onChange={handleChange}
                  placeholder="16"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            Next: Add Medications
          </Button>
        </Card>
      )}

      {/* Step 2: Medications */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Medications</h2>

          {selectedMedications.map((med, index) => (
            <Card key={index} className="p-4 bg-slate-50 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-900">Medication {index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveMedication(index)}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-900 mb-2 block">
                  Medication *
                </Label>
                <select
                  value={med.medicationId}
                  onChange={(e) =>
                    handleMedicationChange(index, 'medicationId', e.target.value)
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select medication</option>
                  {medications.map((medication) => (
                    <option key={medication.id} value={medication.id}>
                      {medication.name} ({medication.generic_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-900 mb-2 block">
                    Dosage
                  </Label>
                  <Input
                    type="text"
                    value={med.dosage}
                    onChange={(e) =>
                      handleMedicationChange(index, 'dosage', e.target.value)
                    }
                    placeholder="500mg"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900 mb-2 block">
                    Frequency
                  </Label>
                  <Input
                    type="text"
                    value={med.frequency}
                    onChange={(e) =>
                      handleMedicationChange(index, 'frequency', e.target.value)
                    }
                    placeholder="Once daily"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900 mb-2 block">
                    Duration
                  </Label>
                  <Input
                    type="text"
                    value={med.duration}
                    onChange={(e) =>
                      handleMedicationChange(index, 'duration', e.target.value)
                    }
                    placeholder="7 days"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900 mb-2 block">
                    Route
                  </Label>
                  <Input
                    type="text"
                    value={med.route}
                    onChange={(e) =>
                      handleMedicationChange(index, 'route', e.target.value)
                    }
                    placeholder="Oral"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </Card>
          ))}

          <Button
            type="button"
            onClick={handleAddMedication}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            + Add Another Medication
          </Button>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => setStep(1)}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Case...' : 'Create Case'}
            </Button>
          </div>
        </Card>
      )}
    </form>
  )
}
