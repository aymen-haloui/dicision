'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { ArrowLeft, Activity, CheckCircle2, FileText, FlaskConical, ShieldAlert, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 transition hover:text-[#2CB1BC]">
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
              <span>/</span>
              <span className="text-slate-600">Règles cliniques</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2CB1BC]/10 text-[#2CB1BC]">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Gestion des règles décisionnelles cliniques</h1>
                <p className="mt-1 text-sm text-slate-500 sm:text-base">
                  Gérer, tester et surveiller les règles décisionnelles cliniques.
                </p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <Alert className={message.includes('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={message.includes('✅') ? 'text-green-800' : 'text-red-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200/80 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2CB1BC]/10 text-[#2CB1BC]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Version</p>
                <p className="text-lg font-semibold text-slate-900">1.0.0</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Score max</p>
                <p className="text-lg font-semibold text-slate-900">100</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Statut</p>
                <p className="text-lg font-semibold text-slate-900">Opérationnel</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <Card className="overflow-hidden border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-200/80 bg-slate-50/60">
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Opérations courantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <Link href="/dashboard/admin/clinical-rules" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Voir toutes les règles
                </Button>
              </Link>
              <Link href="/dashboard/admin/clinical-sandbox" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Bac d'essai
                </Button>
              </Link>
              <Button onClick={handleSeed} disabled={seeding} className="w-full justify-start">
                <span className="mr-2">🌱</span>
                {seeding ? 'Initialisation en cours...' : "Charger des règles d'exemple"}
              </Button>
              <Button onClick={handleTest} disabled={testing} className="w-full justify-start" variant="secondary">
                <span className="mr-2">🧪</span>
                {testing ? 'Tests en cours...' : 'Exécuter les tests unitaires'}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="overflow-hidden border-slate-200/80 shadow-sm">
              <CardHeader className="border-b border-slate-200/80 bg-slate-50/60">
                <CardTitle className="text-lg">État du système</CardTitle>
                <CardDescription>Informations sur le moteur</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Version</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">1.0.0</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Score de risque max</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">100</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
                  <p className="text-sm text-slate-500">Délai d'évaluation</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">5000ms</p>
                </div>
              </CardContent>
            </Card>

            {testResult && (
              <Card className="overflow-hidden border-slate-200/80 shadow-sm">
                <CardHeader className="border-b border-slate-200/80 bg-slate-50/60">
                  <CardTitle className="text-lg">Résultats des tests unitaires</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-mono text-slate-700">
                    {testResult.logs.map((log: string, i: number) => (
                      <div key={i} className={log.includes('✅') ? 'text-green-700' : log.includes('❌') ? 'text-red-700' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {seedResult && (
              <Card className="overflow-hidden border-slate-200/80 shadow-sm">
                <CardHeader className="border-b border-slate-200/80 bg-slate-50/60">
                  <CardTitle className="text-lg">Résultat de l'initialisation</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <pre className="max-h-[320px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {JSON.stringify(seedResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden border-slate-200/80 shadow-sm">
              <CardHeader className="border-b border-slate-200/80 bg-slate-50/60">
                <CardTitle>Aperçu des fonctionnalités</CardTitle>
                <CardDescription>Fonctionnalités disponibles dans ce système</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div>
                  <h4 className="mb-2 font-semibold text-slate-900">Fonctionnalités principales</h4>
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

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="mb-2 font-semibold text-slate-900">APIs disponibles</h4>
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
      </div>
    </div>
  )
}
