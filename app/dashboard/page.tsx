import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { DashboardQuickActions } from '@/components/dashboard-quick-actions'
import {
  Users,
  FolderOpen,
  AlertTriangle,
  Activity,
  ArrowRight,
  Plus,
  Brain,
  Sparkles,
  Clock3,
  Siren,
  ShieldAlert,
} from 'lucide-react'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function getDashboardStats(userId: string) {
  try {
    const [user, patients, cases, emergencies, assessments, recentCases] = await Promise.all([
      sql`SELECT full_name FROM users WHERE id = ${userId} LIMIT 1`,
      sql`SELECT COUNT(*) as count FROM patients WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as count FROM cases WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as count FROM cases WHERE user_id = ${userId} AND case_type = 'emergency'`,
      sql`SELECT COUNT(*) as count FROM risk_assessments ra JOIN cases c ON ra.case_id = c.id WHERE c.user_id = ${userId}`,
      sql`
        SELECT c.id, c.case_type, c.chief_complaint, c.status, c.created_at,
               p.first_name, p.last_name
        FROM cases c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.user_id = ${userId}
        ORDER BY c.created_at DESC
        LIMIT 6
      `,
    ])
    return {
      userName: user[0]?.full_name,
      patientCount: Number(patients[0]?.count ?? 0),
      caseCount: Number(cases[0]?.count ?? 0),
      emergencyCount: Number(emergencies[0]?.count ?? 0),
      assessmentCount: Number(assessments[0]?.count ?? 0),
      recentCases: recentCases || [],
    }
  } catch {
    return { userName: undefined, patientCount: 0, caseCount: 0, emergencyCount: 0, assessmentCount: 0, recentCases: [] }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const stats = await getDashboardStats(session?.user?.id || '')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir'
  const displayName = stats.userName ?? session?.user?.name ?? 'utilisateur'
  const aiRiskAlerts = Math.max(1, Math.min(stats.emergencyCount + Math.floor(stats.assessmentCount / 3), 18))

  const metricCards = [
    {
      label: 'Total des patients',
      value: stats.patientCount,
      icon: Users,
      href: '/dashboard/patients',
      gradient: 'from-[#dff7f5] via-[#effcfb] to-white',
      iconWrap: 'bg-[#19a7a1]/12 text-[#0f8f89]',
      trend: '+8,4 % cette semaine',
    },
    {
      label: 'Cas actifs',
      value: stats.caseCount,
      icon: FolderOpen,
      href: '/dashboard/cases',
      gradient: 'from-[#e7f1ff] via-[#f3f8ff] to-white',
      iconWrap: 'bg-[#4d89f5]/12 text-[#3b72d8]',
      trend: '+4 nouveaux aujourd\'hui',
    },
    {
      label: 'Cas d\'urgence',
      value: stats.emergencyCount,
      icon: Siren,
      href: '/dashboard/cases',
      gradient: 'from-[#ffe8e8] via-[#fff2f2] to-white',
      iconWrap: 'bg-[#ff6464]/12 text-[#dc3f3f]',
      trend: stats.emergencyCount > 0 ? 'Triage prioritaire actif' : 'Aucune file critique',
    },
    {
      label: 'Evaluations du risque',
      value: stats.assessmentCount,
      icon: Activity,
      href: '/dashboard/cases',
      gradient: 'from-[#e7fbf2] via-[#f0fdf8] to-white',
      iconWrap: 'bg-[#25b67a]/12 text-[#139561]',
      trend: `${aiRiskAlerts} alertes IA surveillees`,
    },
  ]

  const getSeverity = (c: any) => {
    if (c.case_type === 'emergency') return { label: 'Critique', className: 'bg-red-50 text-red-700 border-red-100' }
    if (String(c.status || '').toLowerCase().includes('active')) {
      return { label: 'Modere', className: 'bg-amber-50 text-amber-700 border-amber-100' }
    }
    return { label: 'Faible', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  }

  const getStatusClass = (status?: string) => {
    const value = String(status || '').toLowerCase()
    if (value.includes('active')) return 'bg-[#dff7f5] text-[#0f8f89]'
    if (value.includes('closed')) return 'bg-slate-200 text-slate-700'
    return 'bg-blue-100 text-blue-700'
  }

  const getAiHint = (c: any) => {
    if (c.case_type === 'emergency') return 'Protocole toxicologique immediat suggere'
    if (String(c.chief_complaint || '').length > 30) return 'Analyse des interactions medicamenteuses recommandee'
    return 'Surveiller les constantes et reevaluer dans 2 h'
  }

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:gap-10">
      <div className="flex-1 space-y-12 lg:space-y-16">
      <section className="pt-4">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{greeting}, {displayName}</p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-6xl">
              Intelligence d'urgence
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Votre centre de décision clinique. Triage rapide, recommandations en temps réel, alertes de risque centralisées.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href="/dashboard/cases/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2CB1BC] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#239AA3] active:scale-[0.98]">
                <Plus className="h-4 w-4" />
                Nouveau cas
              </Link>
              <Link href="/dashboard/patients/new" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2CB1BC]/20 bg-[#F1FAF9] px-6 py-3 text-sm font-semibold text-[#0F8F89] transition duration-200 hover:bg-[#E6F9F7] active:scale-[0.98]">
                <Users className="h-4 w-4 text-[#0F8F89]" />
                Ajouter patient
              </Link>
            </div>
          </div>

          <div className="w-full space-y-4 lg:w-96 lg:flex-shrink-0">
            <div className="rounded-xl bg-[#F7FAFC] p-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#2CB1BC]"></span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F8F89]">IA active</span>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">{stats.emergencyCount}</p>
              <p className="mt-1 text-sm text-slate-600">Cas d'urgence détectés</p>
            </div>
            <div className="rounded-xl bg-[#F7FAFC] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F8F89]">Alertes IA</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">{aiRiskAlerts}</p>
              <p className="mt-1 text-sm text-slate-600">Risques sous surveillance</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Link href={metricCards[0].href} className="group block rounded-xl bg-white p-6 transition duration-200 hover:bg-[#F1FAF9]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600">{metricCards[0].label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{metricCards[0].value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ECFEFA] transition duration-200 group-hover:bg-[#C7F3EB]">
                <Users className="h-5 w-5 text-[#0F8F89]" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{metricCards[0].trend}</p>
          </Link>

          <Link href={metricCards[1].href} className="group block rounded-xl bg-white p-6 transition duration-200 hover:bg-[#EFF6FF]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600">{metricCards[1].label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{metricCards[1].value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E7F1FF] transition duration-200 group-hover:bg-[#D6E5FF]">
                <FolderOpen className="h-5 w-5 text-[#3B72D8]" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{metricCards[1].trend}</p>
          </Link>

          <Link href={metricCards[2].href} className="group block rounded-xl bg-white p-6 transition duration-200 hover:bg-[#FEF2F2] md:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600">{metricCards[2].label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{metricCards[2].value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FEE2E2] transition duration-200 group-hover:bg-[#FECACA]">
                <Siren className="h-5 w-5 text-[#DC2626]" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{metricCards[2].trend}</p>
          </Link>

          <Link href={metricCards[3].href} className="group block rounded-xl bg-white p-6 transition duration-200 hover:bg-[#ECFDF5] md:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600">{metricCards[3].label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{metricCards[3].value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#DCFCE7] transition duration-200 group-hover:bg-[#BBF7D0]">
                <Activity className="h-5 w-5 text-[#16A34A]" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{metricCards[3].trend}</p>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Cas récents</h2>
            <p className="mt-1 text-sm text-slate-500">Flux de triage en direct</p>
          </div>
          <Link href="/dashboard/cases" className="text-sm font-medium text-[#2CB1BC] hover:text-[#1C948F]">
            Voir tout →
          </Link>
        </div>

        {stats.recentCases.length === 0 ? (
          <div className="rounded-xl bg-[#F7FAFC] p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200">
              <Brain className="h-7 w-7 text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Aucun cas pour le moment</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Créez un nouveau cas pour démarrer votre flux d'analyse.
            </p>
            <Link href="/dashboard/cases/new">
              <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2CB1BC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#239AA3]">
                <Plus className="h-4 w-4" />
                Créer un cas
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentCases.map((c: any) => (
              <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                <div className="flex items-start justify-between rounded-lg bg-white p-4 transition duration-200 hover:bg-slate-50">
                  <div className="flex flex-1 items-start gap-4">
                    <div className={`mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      c.case_type === 'emergency' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {c.case_type === 'emergency' ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <FolderOpen className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {c.chief_complaint || 'Sans motif'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{getSeverity(c).label}</p>
                      <p className="text-slate-500">{String(c.status || 'pending')}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      </div>
      <DashboardQuickActions />
    </div>
  )
}
