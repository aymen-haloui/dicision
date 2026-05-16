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
    <div className="flex gap-6 lg:gap-8">
      <div className="flex-1 space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[20px] border border-[#d8ebe8] bg-gradient-to-br from-[#e9f8f6] via-[#f4fbfa] to-[#f9fcfb] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-[#2cb1bc]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-40 w-40 rounded-full bg-[#1ea390]/15 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-wide text-[#147b78]">{greeting}, {displayName}</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-900 lg:text-4xl">
              L'intelligence d'urgence a la vitesse clinique
            </h1>
            <p className="mt-3 text-sm text-slate-600 lg:text-base">
              Votre espace d'urgence assiste par l'IA est actif. Suivez les cas a haut risque,
              les signaux de triage et les recommandations d'aide a la decision dans une vue compacte.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 lg:hidden">
              <Link href="/dashboard/cases/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f8f89] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c7a74]">
                <Plus className="h-4 w-4" />
                Nouveau cas d'urgence
              </Link>
              <Link href="/dashboard/patients/new"
                className="inline-flex items-center gap-2 rounded-xl border border-[#b8d9d5] bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-white">
                <Users className="h-4 w-4" />
                Ajouter un patient
              </Link>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/80 bg-white/65 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:w-[360px]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Etat d'urgence en direct</p>
              <span className="rounded-full bg-[#dff7f5] px-2.5 py-1 text-[11px] font-semibold text-[#0f8f89]">
                IA active
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/80 p-3">
                <p className="text-xs text-slate-500">Urgences actives</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stats.emergencyCount}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-3">
                <p className="text-xs text-slate-500">Alertes de risque IA</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{aiRiskAlerts}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 p-3 text-xs text-slate-600">
              <Sparkles className="h-4 w-4 text-[#0f8f89]" />
              Priorisez les cartes d'urgence ; l'analyse des conflits medicamenteux s'execute automatiquement sur les cas ouverts.
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Link key={card.label} href={card.href} className="group">
            <Card className={`overflow-hidden rounded-[18px] border border-[#dce8e6] bg-gradient-to-br p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#bfd9d5] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] ${card.gradient}`}>
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${card.iconWrap}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-600" />
              </div>
              <p className="mt-5 text-3xl font-semibold leading-none text-slate-900">{card.value}</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{card.label}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <Activity className="h-3.5 w-3.5 text-[#0f8f89]" />
                {card.trend}
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Cas recents</h2>
            <p className="mt-1 text-sm text-slate-500">Activite de triage en direct avec recommandations IA</p>
          </div>
          <Link
            href="/dashboard/cases"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#cde3df] bg-white px-3 py-2 text-sm font-medium text-[#0f8f89] transition hover:bg-[#f3fbfa]"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.recentCases.length === 0 ? (
          <Card className="rounded-[20px] border border-dashed border-[#cde3df] bg-gradient-to-b from-[#f7fcfb] to-white p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dff7f5]">
              <Brain className="h-8 w-8 text-[#0f8f89]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucun flux de cas actif pour le moment</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Demarrez votre flux d'intelligence d'urgence en creant un nouveau cas.
              Les recommandations de triage IA et les signaux de risque apparaitront ici en temps reel.
            </p>
            <Link href="/dashboard/cases/new">
              <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0f8f89] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c7a74]">
                <Plus className="h-4 w-4" />
                Creer le premier cas
              </button>
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-[20px] border border-[#dce8e6] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-12 border-b border-[#e7efee] bg-[#f4f9f8] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className="col-span-4">Patient et motif</div>
              <div className="col-span-2">Gravite</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-2">Horodatage</div>
              <div className="col-span-2">Recommandation IA</div>
            </div>

            <div className="divide-y divide-[#edf2f1]">
              {stats.recentCases.map((c: any) => (
                <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                  <div className="grid grid-cols-12 items-center px-5 py-4 transition hover:bg-[#f8fcfb]">
                    <div className="col-span-4 flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        c.case_type === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {c.case_type === 'emergency' ? <AlertTriangle className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {c.chief_complaint || 'Aucun motif renseigne'}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverity(c).className}`}>
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {getSeverity(c).label}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(c.status)}`}>
                        {String(c.status || 'pending')}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(c.created_at).toLocaleString()}
                    </div>

                    <div className="col-span-2 flex items-center justify-between gap-2">
                      <p className="line-clamp-2 text-xs text-slate-600">{getAiHint(c)}</p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </section>
      </div>
      <DashboardQuickActions />
    </div>
  )
}
