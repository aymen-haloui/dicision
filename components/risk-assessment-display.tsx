interface Finding {
  type: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  description: string
  recommendation: string
}

interface Recommendation {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  action: string
}

interface RiskAssessment {
  id: string
  risk_score: number
  risk_level: 'low' | 'moderate' | 'high' | 'critical'
  findings: { findings: Finding[] }
  recommendations: { recommendations: Recommendation[] }
  created_at: string
}

const RISK_LEVEL_LABELS: Record<string, string> = {
  low: 'Faible',
  moderate: 'Modéré',
  high: 'Élevé',
  critical: 'Critique',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
}

export default function RiskAssessmentDisplay({
  assessment,
}: {
  assessment: RiskAssessment
}) {
  const getProgressWidthClass = (score: number) => {
    if (score >= 95) return 'w-[95%]'
    if (score >= 90) return 'w-[90%]'
    if (score >= 85) return 'w-[85%]'
    if (score >= 80) return 'w-[80%]'
    if (score >= 75) return 'w-[75%]'
    if (score >= 70) return 'w-[70%]'
    if (score >= 65) return 'w-[65%]'
    if (score >= 60) return 'w-[60%]'
    if (score >= 55) return 'w-[55%]'
    if (score >= 50) return 'w-[50%]'
    if (score >= 45) return 'w-[45%]'
    if (score >= 40) return 'w-[40%]'
    if (score >= 35) return 'w-[35%]'
    if (score >= 30) return 'w-[30%]'
    if (score >= 25) return 'w-[25%]'
    if (score >= 20) return 'w-[20%]'
    if (score >= 15) return 'w-[15%]'
    if (score >= 10) return 'w-[10%]'
    if (score >= 5) return 'w-[5%]'
    return 'w-0'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'high':
        return 'bg-orange-50 border-orange-200'
      case 'moderate':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-green-50 border-green-200'
    }
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'high':
        return 'border-orange-200 bg-orange-50'
      case 'moderate':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  const findings = assessment.findings?.findings || []
  const recommendations = assessment.recommendations?.recommendations || []

  return (
    <div className={`border-2 rounded-lg p-6 ${getRiskColor(assessment.risk_level)}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Evaluation du risque</h3>
        <span
          className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getRiskBadgeColor(assessment.risk_level)}`}
        >
          {RISK_LEVEL_LABELS[assessment.risk_level] || assessment.risk_level.toUpperCase()}
        </span>
      </div>

      {/* Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-600">Score de risque</p>
          <p className="text-3xl font-bold text-slate-900">
            {assessment.risk_score.toFixed(1)}/100
          </p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getProgressWidthClass(assessment.risk_score)} ${
              assessment.risk_level === 'critical'
                ? 'bg-red-500'
                : assessment.risk_level === 'high'
                  ? 'bg-orange-500'
                  : assessment.risk_level === 'moderate'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
            }`}
          />
        </div>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-slate-900 mb-3">Constats cles</h4>
          <div className="space-y-3">
            {findings.map((finding, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(finding.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-slate-900">{finding.type.replace(/_/g, ' ')}</p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      finding.severity === 'critical'
                        ? 'bg-red-200 text-red-800'
                        : finding.severity === 'high'
                          ? 'bg-orange-200 text-orange-800'
                          : finding.severity === 'moderate'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {RISK_LEVEL_LABELS[finding.severity] || finding.severity}
                  </span>
                </div>
                <p className="text-slate-700 mb-2">{finding.description}</p>
                <p className="text-sm text-slate-600 italic">
                  Recommandation : {finding.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Recommandations cliniques</h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-300 bg-blue-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-slate-900">{rec.title}</p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      rec.priority === 'high'
                        ? 'bg-red-200 text-red-800'
                        : rec.priority === 'medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {PRIORITY_LABELS[rec.priority] || rec.priority}
                  </span>
                </div>
                <p className="text-slate-700 mb-2">{rec.description}</p>
                <p className="text-sm font-semibold text-slate-800">Action : {rec.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-6">
        Evaluation creee le : {new Date(assessment.created_at).toLocaleString()}
      </p>
    </div>
  )
}
