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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Clinical Decision Rules Management</h1>
          <p className="text-slate-600">Manage, test, and monitor clinical decision rules</p>
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
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/admin/clinical-rules">
                <Button className="w-full" variant="outline">
                  View All Rules
                </Button>
              </Link>
              <Link href="/dashboard/admin/clinical-sandbox">
                <Button className="w-full" variant="outline">
                  Test Sandbox
                </Button>
              </Link>
              <Button onClick={handleSeed} disabled={seeding} className="w-full">
                {seeding ? 'Seeding...' : '🌱 Seed Example Rules'}
              </Button>
              <Button onClick={handleTest} disabled={testing} className="w-full" variant="secondary">
                {testing ? 'Testing...' : '🧪 Run Unit Tests'}
              </Button>
            </CardContent>
          </Card>

          {/* STATS */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Engine information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Version</p>
                <p className="text-lg font-semibold text-slate-900">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Max Risk Score</p>
                <p className="text-lg font-semibold text-slate-900">100</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Evaluation Timeout</p>
                <p className="text-lg font-semibold text-slate-900">5000ms</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500">Status: <span className="text-green-600 font-bold">Operational</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UNIT TEST RESULTS */}
        {testResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Unit Test Results</CardTitle>
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
              <CardTitle className="text-lg">Seeding Result</CardTitle>
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
            <CardTitle>Feature Overview</CardTitle>
            <CardDescription>What's available in this system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Core Features</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>✅ Centralized medical rule engine</li>
                <li>✅ Configurable rule priorities (0-100)</li>
                <li>✅ Risk score aggregation by category</li>
                <li>✅ Automatic urgency escalation</li>
                <li>✅ Audit trail for all rule triggers</li>
                <li>✅ Comprehensive rule validation</li>
                <li>✅ Sandbox for hypothesis testing</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-slate-900 mb-2">Available APIs</h4>
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
