import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  FlaskConical,
  ShieldAlert,
  Pill,
  Activity,
  ClipboardPlus,
  Cpu,
  FileCheck2,
  Stethoscope,
  UserRound,
  TriangleAlert,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/navbar'

export default function LandingPage() {
  return (
    <div className="min-h-screen landing-bg text-foreground">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 md:pb-36 md:pt-28">
        <Image
          src="/medical-hero.jpg"
          alt="Medecin en consultation avec un patient"
          fill
          priority
          className="object-cover object-top"
        />
        {/* Strong left-to-right gradient: dark left (90%) -> lighter right (45%) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/88 via-[#0f2744]/60 to-[#0f172a]/35" />
        {/* Subtle vertical vignette for polish */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
        <div className="hero-grid-bg pointer-events-none absolute inset-0 opacity-20" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl space-y-6 sm:space-y-8">
            {/* Headline */}
            <div className="hero-headline space-y-2">
              <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl md:leading-[1.08]">
                Anticipez le risque<br />
                <span className="text-[#2CB1BC]">toxicologique</span> et<br />
                securisez chaque decision.
              </h1>
            </div>

            {/* Subtitle */}
            <p className="hero-subtitle max-w-xl text-sm leading-relaxed text-white/75 sm:text-base md:text-lg">
              HEXA combine l'intelligence artificielle, la pharmacogenomique
              et les references cliniques pour detecter les interactions,
              prioriser les risques et proposer des posologies personnalisees.
            </p>

            {/* CTAs */}
            <div className="hero-ctas flex flex-col gap-3 pt-1 sm:flex-row">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button className="h-12 w-full rounded-xl bg-[#2CB1BC] px-8 font-semibold text-white shadow-[0_10px_28px_rgba(44,177,188,0.35)] transition-all duration-250 hover:scale-[1.03] hover:bg-[#239AA3] active:scale-[0.98] sm:w-auto">
                  Acceder a la plateforme
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border border-white/25 bg-white/8 px-8 font-medium text-white backdrop-blur-sm transition-all duration-250 hover:scale-[1.03] hover:border-white/50 hover:bg-white/16 active:scale-[0.98] sm:w-auto"
              >
                Voir la demonstration
              </Button>
            </div>

            {/* Stats cards - glassmorphism */}
            <div className="hero-stats grid max-w-2xl grid-cols-3 gap-2 pt-2 sm:gap-3">
              {heroStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="stat-card rounded-xl border border-white/15 bg-white/8 px-3 py-3 backdrop-blur-md transition-all duration-300 hover:border-[#2CB1BC]/60 hover:bg-white/12 sm:px-5 sm:py-4"
                >
                  <div className="mb-1 hidden text-[#2CB1BC] sm:block">{stat.icon}</div>
                  <p className="text-lg font-bold text-white sm:text-2xl">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-white/65 sm:text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="valeur" className="bg-[#F7FAFC] px-4 py-14 text-slate-900 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl rounded-2xl border border-teal-100 bg-white p-8 shadow-soft md:p-12">
          <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2CB1BC]">
                Valeur clinique
              </p>
              <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                Une intelligence clinique qui accelere les decisions tout en
                diminuant le risque therapeutique.
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                En quelques secondes, l'equipe medicale visualise les alertes
                prioritaires, identifie les interactions critiques et obtient une
                conduite therapeutique argumentee. Le resultat: moins d'incertitude,
                plus de temps pour la prise en charge patient.
              </p>
            </div>

            <div className="grid gap-3">
              {clinicalValues.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#F7FAFC] px-4 pb-14 text-slate-900 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2CB1BC]">
              Capacites
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">Fonctionnalites cles pour la pratique medicale</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,23,42,0.10)]"
              >
                <div className="mb-5 inline-flex rounded-lg border border-teal-200 bg-teal-50 p-3 text-[#2CB1BC] transition group-hover:bg-[#2CB1BC] group-hover:text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnement" className="bg-white px-4 py-14 text-slate-900 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2CB1BC]">
              Comment ca fonctionne
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              Un flux decisionnel en 3 etapes, pense pour les situations reelles
            </h2>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-14 hidden h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent md:block" />
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_22px_rgba(15,23,42,0.07)]">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#2CB1BC] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="mb-4 inline-flex rounded-lg border border-teal-200 bg-teal-50 p-2 text-[#2CB1BC]">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apercu" className="bg-[#F7FAFC] px-4 py-14 text-slate-900 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2CB1BC]">
              Apercu produit
            </p>
            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
              Interface clinique lisible, orientee action et priorisation du risque
            </h2>
            <p className="text-lg leading-relaxed text-slate-600">
              Le tableau de bord centralise la vue patient, les alertes
              d'interactions et les recommandations de dose. Chaque signal est
              contextualise pour favoriser une decision rapide et defendable.
            </p>
            <div className="grid gap-3 pt-2">
              <div className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                <TriangleAlert className="h-4 w-4 text-amber-500" />
                Niveaux de risque: faible, modere, eleve, critique
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                <Pill className="h-4 w-4 text-[#2CB1BC]" />
                Vue interactions medicament / plante / metabolisme
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Recommandations exploitables en consultation et aux urgences
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.09)]">
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-[#F7FAFC]">
              <Image
                src="/clinical-dashboard-preview.svg"
                alt="Apercu visuel du tableau de bord clinique avec niveaux de risque et interactions"
                width={1400}
                height={980}
                className="h-auto w-full"
              />
            </div>
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-100 text-[#2CB1BC]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Dossier patient #UR-2026-148</p>
                  <p className="text-xs text-slate-500">Femme, 62 ans, insuffisance renale moderee</p>
                </div>
              </div>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-[#DC2626]">
                Priorite haute
              </span>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Carte des interactions</p>
                <div className="mt-4 space-y-3">
                  {previewInteractions.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-700">{item.label}</span>
                      <span className={item.badgeClass}>{item.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Indice de risque global</p>
                <div className="mt-4 space-y-3">
                  <div className="h-28 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 p-4 text-white">
                    <p className="text-xs text-amber-100">Risque calcule</p>
                    <p className="mt-1 text-3xl font-semibold">76%</p>
                    <p className="text-xs text-amber-100">Ajustement immediat recommande</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                    Dose cible: 2,5 mg/jour avec reevaluation a 24h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 text-slate-900 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-8 shadow-soft md:p-12">
          <div className="mb-8 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2CB1BC]">
              Credibilite medicale
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              Une approche rigoureuse pour un usage clinique reel
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 inline-flex rounded-lg bg-teal-50 p-2 text-[#2CB1BC]">{item.icon}</div>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold tracking-wide text-[#2CB1BC]">
              Donnees pharmacologiques validees
            </span>
            <span className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold tracking-wide text-[#2CB1BC]">
              Workflow compatible urgence et consultation
            </span>
            <span className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold tracking-wide text-[#2CB1BC]">
              Logique de recommandation explicable
            </span>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 pt-6 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-7xl rounded-2xl border border-teal-200 bg-gradient-to-r from-[#EBF8FF] via-[#F7FAFC] to-[#EBF8FF] p-10 text-center shadow-soft">
          <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Optimisez vos decisions cliniques des aujourd'hui
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Offrez a vos equipes une aide a la decision rapide, argumentee et
            centree sur la securite therapeutique.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/auth/login">
              <Button className="h-12 rounded-xl bg-[#2CB1BC] px-8 font-semibold text-white shadow-[0_12px_24px_rgba(44,177,188,0.24)] transition hover:bg-[#239AA3]">
                Commencer maintenant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 text-slate-600 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-800">HEXA</p>
            <p className="mt-1 text-sm">Plateforme d'aide a la decision en toxicologie et posologie personnalisee.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm sm:gap-6">
            <a href="#features" className="transition hover:text-slate-900">Fonctionnalites</a>
            <a href="#fonctionnement" className="transition hover:text-slate-900">Fonctionnement</a>
            <a href="#apercu" className="transition hover:text-slate-900">Apercu</a>
          </div>
          <p className="text-sm text-slate-500">(c) 2026 HEXA. Tous droits reserves.</p>
        </div>
      </footer>
    </div>
  )
}

const heroStats = [
  { value: '< 20 s', label: 'pour prioriser un risque critique', icon: <Activity className="h-4 w-4" /> },
  { value: '360 deg', label: 'vision interactions et contexte patient', icon: <FlaskConical className="h-4 w-4" /> },
  { value: '24/7', label: 'support decisionnel disponible', icon: <Stethoscope className="h-4 w-4" /> },
]

const clinicalValues = [
  {
    title: 'Gain de temps operationnel',
    detail: 'Synthese clinique immediate avec priorisation des alertes a forte gravite.',
  },
  {
    title: 'Reduction du risque iatrogene',
    detail: 'Detection proactive des combinaisons a risque medicament-plante et medicament-medicament.',
  },
  {
    title: 'Aide a la decision fiable',
    detail: 'Recommandations argumentees pour soutenir la prescription et la reevaluation therapeutique.',
  },
]

const features = [
  {
    icon: <FlaskConical className="h-5 w-5" />,
    title: 'Analyse toxicologique avancee',
    description:
      'Evaluation multicritere des risques lies aux medicaments, plantes et profils patient complexes.',
  },
  {
    icon: <ShieldAlert className="h-5 w-5" />,
    title: 'Detection intelligente des interactions',
    description:
      'Identification automatisee des interactions medicament-medicament, plante-medicament et plante-plante.',
  },
  {
    icon: <Pill className="h-5 w-5" />,
    title: 'Posologie personnalisee',
    description:
      'Ajustements de dose bases sur les parametres cliniques, biologiques et pharmacogenomiques.',
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Support decisionnel en situation critique',
    description:
      'Recommandations priorisees pour les decisions en urgence et les parcours de soins a haut risque.',
  },
]

const steps = [
  {
    icon: <ClipboardPlus className="h-5 w-5" />,
    title: 'Saisie des donnees patient',
    description:
      'Renseignez rapidement les traitements, les prises de plantes, le contexte clinique et les biomarqueurs clefs.',
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "Analyse par intelligence artificielle",
    description:
      "Le moteur combine toxicologie, bases d'interactions et signaux pharmacogenomiques en temps reel.",
  },
  {
    icon: <FileCheck2 className="h-5 w-5" />,
    title: 'Recommandations cliniques exploitables',
    description:
      'Recevez un plan dâ€™action immediat: niveau de risque, adaptations de dose et surveillance recommandee.',
  },
]

const previewInteractions = [
  {
    label: 'Warfarine + Millepertuis',
    level: 'Eleve',
    badgeClass:
      'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700',
  },
  {
    label: 'Aspirine + Ginkgo biloba',
    level: 'Critique',
    badgeClass: 'rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700',
  },
  {
    label: 'Metformine + Reglisse',
    level: 'Modere',
    badgeClass: 'rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700',
  },
]

const trustItems = [
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: 'Base sur des donnees validees',
    description:
      'Corpus de references cliniques et pharmacologiques structure pour la pratique medicale.',
  },
  {
    icon: <Stethoscope className="h-5 w-5" />,
    title: 'Concu pour un usage clinique reel',
    description:
      'Interface optimisee pour les medecins, urgentistes et pharmaciens en environnement contraint.',
  },
  {
    icon: <UserRound className="h-5 w-5" />,
    title: 'Approche centree patient',
    description:
      "Chaque recommandation tient compte du profil individuel et du contexte therapeutique complet.",
  },
]
