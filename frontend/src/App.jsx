import { useState } from 'react'
import Header from './components/Header'
import PRDInput from './components/PRDInput'
import AuditPanel from './components/AuditPanel'
import UATMatrix from './components/UATMatrix'
import LoadingOverlay from './components/LoadingOverlay'
import StatsBar from './components/StatsBar'

const HERO_FEATURES = [
  { icon: '🔍', label: 'PRD Audit', desc: 'Flags vague & missing requirements' },
  { icon: '🧪', label: 'UAT Matrix', desc: 'Structured test suite in seconds' },
  { icon: '📊', label: 'Risk Analysis', desc: 'High / Medium / Low severity' },
  { icon: '📥', label: 'CSV Export', desc: 'One-click download for your team' },
]

export default function App() {
  const [prd, setPrd] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!prd.trim()) return
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/generate-uat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd_text: prd }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || `Server error: ${res.status}`)
      }

      setResult(data)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* Hero section — shown only when no result yet */}
        {!result && !isLoading && (
          <section className="text-center space-y-5 animate-fade-in pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Powered by Google Gemini 2.0 Flash
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
              Automate Your{' '}
              <span className="gradient-text">UAT Testing</span>
              <br />with AI Precision
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
              Paste your PRD or user stories. Testify audits requirements for risks and generates
              a complete, exportable UAT matrix in seconds.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {HERO_FEATURES.map(f => (
                <div key={f.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card border-slate-700/30 hover:border-slate-600/50 transition-all duration-200">
                  <span className="text-lg">{f.icon}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200">{f.label}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reset bar when result is shown */}
        {result && !isLoading && (
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Analysis Complete</h2>
              <p className="text-xs text-slate-400 mt-0.5">Review your audit findings and UAT matrix below</p>
            </div>
            <button onClick={handleReset} className="btn-secondary text-xs !py-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              New Analysis
            </button>
          </div>
        )}

        {/* PRD Input — always visible when no result */}
        {!result && (
          <PRDInput
            value={prd}
            onChange={setPrd}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        )}

        {/* Error alert */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/25 animate-fade-in">
            <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-400">Request Failed</p>
              <p className="text-xs text-rose-300/80 mt-0.5 leading-relaxed">{error}</p>
              <p className="text-xs text-slate-500 mt-2">
                Make sure the backend is running on port 8000 and your GEMINI_API_KEY is configured in{' '}
                <code className="font-mono text-slate-400">backend/.env</code>.
              </p>
            </div>
            <button onClick={() => setError(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && <LoadingOverlay />}

        {/* Results */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* Stats */}
            <StatsBar testCases={result.test_cases} />

            {/* Audit findings */}
            <AuditPanel
              auditFindings={result.audit_findings}
              overallRisk={result.overall_risk}
            />

            {/* UAT Matrix table */}
            <UATMatrix
              testCases={result.test_cases}
              summary={result.summary}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            © 2026 Testify — Enterprise AI UAT Platform
          </p>
          <p className="text-xs text-slate-600">
            Built with FastAPI · React · Google Gemini 2.0 Flash
          </p>
        </div>
      </footer>
    </div>
  )
}
