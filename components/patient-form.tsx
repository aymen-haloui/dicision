'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PatientFormProps {
  patientId?: string
  initialData?: {
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender?: string
    medicalRecordNumber?: string
    allergies?: string
    comorbidities?: string
  }
  mode?: 'create' | 'edit'
}

export default function PatientForm({ 
  patientId, 
  initialData,
  mode = 'create'
}: PatientFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState(
    initialData || {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      medicalRecordNumber: '',
      allergies: '',
      comorbidities: '',
    }
  )
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!formData.firstName || !formData.lastName) {
        setError('First and last name are required')
        setIsLoading(false)
        return
      }

      const endpoint = mode === 'create' 
        ? '/api/patients'
        : `/api/patients/${patientId}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          medicalRecordNumber: formData.medicalRecordNumber || null,
          allergies: formData.allergies || null,
          comorbidities: formData.comorbidities || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save patient')
        setIsLoading(false)
        return
      }

      const data = await response.json()
      router.push(`/dashboard/patients/${data.id}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium text-slate-900 mb-2 block">
            First Name *
          </Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="lastName" className="text-sm font-medium text-slate-900 mb-2 block">
            Last Name *
          </Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-900 mb-2 block">
            Date of Birth
          </Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="gender" className="text-sm font-medium text-slate-900 mb-2 block">
            Gender
          </Label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="medicalRecordNumber" className="text-sm font-medium text-slate-900 mb-2 block">
          Medical Record Number
        </Label>
        <Input
          id="medicalRecordNumber"
          name="medicalRecordNumber"
          value={formData.medicalRecordNumber}
          onChange={handleChange}
          placeholder="MRN-12345"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="allergies" className="text-sm font-medium text-slate-900 mb-2 block">
          Allergies
        </Label>
        <textarea
          id="allergies"
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          placeholder="List any known allergies..."
          rows={3}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="comorbidities" className="text-sm font-medium text-slate-900 mb-2 block">
          Comorbidities / Medical History
        </Label>
        <textarea
          id="comorbidities"
          name="comorbidities"
          value={formData.comorbidities}
          onChange={handleChange}
          placeholder="List any chronic conditions, diseases, or medical history..."
          rows={3}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          {isLoading 
            ? `${mode === 'create' ? 'Creating' : 'Saving'}...`
            : `${mode === 'create' ? 'Create' : 'Save'} Patient`
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
