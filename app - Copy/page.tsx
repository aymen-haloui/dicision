import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, Brain, Users } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">HEXA</div>
          <nav className="hidden md:flex gap-10 items-center text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition">How it works</a>
            <Link href="/auth/login">
              <Button variant="default" size="sm">Sign in</Button>
            </Link>
          </nav>
          <div className="md:hidden">
            <Link href="/auth/login">
              <Button variant="default" size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-8">
            <div className="space-y-6 max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tighter">
                AI-powered medical decision support
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Real-time toxicology analysis, drug interaction detection, and personalized dosage recommendations for emergency and clinical settings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/login">
                  <Button size="lg" className="bg-primary hover:opacity-90 text-primary-foreground">
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  View demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-16">
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-4xl font-bold">Core capabilities</h2>
              <p className="text-lg text-muted-foreground">
                Everything you need for safe, informed medical decisions
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="p-6 border border-border/50 rounded-lg hover:border-border transition">
                  <div className="mb-4">
                    <div className="inline-flex p-2 bg-secondary rounded-md text-accent">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-24 bg-secondary/30 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-16">
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-4xl font-bold">How it works</h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to medical decision support
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step, index) => (
                <div key={index} className="space-y-4">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h4 className="font-bold mb-2">HEXA</h4>
              <p className="text-muted-foreground text-sm max-w-md">
                AI-powered medical decision support for toxicology, drug interactions, and personalized dosing.
              </p>
            </div>
            <div className="flex gap-8">
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/auth/login" className="hover:text-foreground transition">Platform</Link></li>
                  <li><a href="#features" className="hover:text-foreground transition">Features</a></li>
                  <li><a href="#how" className="hover:text-foreground transition">How it works</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 HEXA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Toxicology Risk Analysis',
    description: 'Automated evaluation of risks from ingested substances in emergency or clinical contexts'
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Interaction Detection',
    description: 'Identifies potentially dangerous drug-drug and drug-plant interactions instantly'
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: 'Personalized Dosing',
    description: 'AI-powered dosage recommendations tailored to each patient and clinical situation'
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Dual Mode Interface',
    description: 'Optimized workflows for both emergency response and clinical decision making'
  }
]

const steps = [
  {
    title: 'Input patient data',
    description: 'Quickly enter patient information and substances involved'
  },
  {
    title: 'Automatic analysis',
    description: 'System analyzes risks and interactions in real-time'
  },
  {
    title: 'Get recommendations',
    description: 'Receive detailed risk assessment with clinical recommendations'
  }
]
