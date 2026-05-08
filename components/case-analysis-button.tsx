'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CaseAnalysisButton({ caseId }: { caseId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/cases/${caseId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Echec de l\'analyse')
        setIsLoading(false)
        return
      }

      // Refresh page to show updated assessment
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue pendant l\'analyse')
      setIsLoading(false)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleAnalyze}
        className="bg-purple-600 hover:bg-purple-700"
        disabled={isLoading}
      >
        {isLoading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
      </Button>
    </>
  )
}
