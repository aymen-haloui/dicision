'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function AdminClinicalRulesPage() {
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [message, setMessage] = useState('')

  async function handleSeed() {
    setSeeding(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/clinical-rules/seed', { method: 'POST' })
      const data = await response.json()
      setSeedResult(data)
      setMessage('✅ Clinical rules seeded successfully!')
    } catch (error: any) {
      setMessage('❌ Failed to seed rules')
      console.error(error)
    } finally {
      setSeeding(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/clinical-rules/test')
      const data = await response.json()
      setTestResult(data)
      setMessage(`✅ ${data.tests_run} unit tests executed`)
    } catch (error: any) {
      setMessage('❌ Failed to run tests')
      console.error(error)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des règles décisionnelles cliniques</h1>
          <p className="text-slate-600">Gérer, tester et surveiller les règles décisionnelles cliniques</p>
        </div>

        {message && (
          <Alert className={message.includes('✅') ? 'bg-green-50 border-green-200 mb-6' : 'bg-red-50 border-red-200 mb-6'}>
            <AlertDescription className={message.includes('✅') ? 'text-green-800' : 'text-red-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* QUICK ACTIONS */}
          <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>Opérations courantes</CardDescription>
              </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/admin/clinical-rules">
                <Button className="w-full" variant="outline">
                  Voir toutes les règles
                </Button>
              </Link>
              <Link href="/dashboard/admin/clinical-sandbox">
                <Button className="w-full" variant="outline">
                  Bac d'essai
                </Button>
              </Link>
              <Button onClick={handleSeed} disabled={seeding} className="w-full">
                {seeding ? "Initialisation en cours..." : '🌱 Charger des règles d\'exemple'}
              </Button>
              <Button onClick={handleTest} disabled={testing} className="w-full" variant="secondary">
                {testing ? 'Tests en cours...' : '🧪 Exécuter les tests unitaires'}
              </Button>
            </CardContent>
          </Card>

          {/* STATS */}
          <Card>
            <CardHeader>
              <CardTitle>État du système</CardTitle>
              <CardDescription>Informations sur le moteur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Version</p>
                <p className="text-lg font-semibold text-slate-900">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Score de risque max</p>
                <p className="text-lg font-semibold text-slate-900">100</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Délai d'évaluation</p>
                <p className="text-lg font-semibold text-slate-900">5000ms</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500">Statut : <span className="text-green-600 font-bold">Opérationnel</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UNIT TEST RESULTS */}
        {testResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Résultats des tests unitaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono text-slate-700">
                {testResult.logs.map((log: string, i: number) => (
                  <div key={i} className={log.includes('✅') ? 'text-green-700' : log.includes('❌') ? 'text-red-700' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEED RESULT */}
        {seedResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Résultat de l'initialisation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(seedResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* FEATURE OVERVIEW */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu des fonctionnalités</CardTitle>
            <CardDescription>Fonctionnalités disponibles dans ce système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Fonctionnalités principales</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>✅ Moteur de règles médicales centralisé</li>
                <li>✅ Priorités de règles configurables (0-100)</li>
                <li>✅ Agrégation du score de risque par catégorie</li>
                <li>✅ Escalade automatique de l'urgence</li>
                <li>✅ Traçabilité (audit) de tous les déclenchements de règles</li>
                <li>✅ Validation complète des règles</li>
                <li>✅ Bac d'essai pour tests d'hypothèses</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-slate-900 mb-2">APIs disponibles</h4>
              <ul className="space-y-1 text-sm text-slate-600 font-mono">
                <li>POST /api/admin/clinical-rules - Create rule</li>
                <li>GET /api/admin/clinical-rules - List all rules</li>
                <li>PUT /api/admin/clinical-rules/:id - Update rule</li>
                <li>DELETE /api/admin/clinical-rules/:id - Delete rule</li>
                <li>PATCH /api/admin/clinical-rules/:id/toggle - Enable/disable</li>
                <li>GET /api/admin/clinical-rules/search - Search & filter</li>
                <li>POST /api/admin/clinical-rules/simulate - Test engine</li>
                <li>GET /api/admin/clinical-rules/audit - View audit logs</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
