export default function LoadingOverlay() {
  const steps = [
    { label: 'Reading PRD…', icon: '📄' },
    { label: 'Auditing requirements…', icon: '🔍' },
    { label: 'Detecting ambiguities…', icon: '⚠️' },
    { label: 'Generating test cases…', icon: '🧪' },
    { label: 'Structuring matrix…', icon: '✅' },
  ]

  return (
    <div className="glass-card p-8 flex flex-col items-center gap-8 animate-fade-in">
      {/* Animated orb */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 animate-pulse-slow" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/40">
          <svg className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} fill="none" viewBox="0 0 24 24">
            <path
              className="opacity-30"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        {/* Orbiting dot */}
        <div
          className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
          style={{
            top: '50%',
            left: '50%',
            transformOrigin: '0 -44px',
            animation: 'spin 2s linear infinite',
            marginTop: '-6px',
            marginLeft: '-6px',
          }}
        />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold gradient-text mb-1">Gemini AI is working…</h3>
        <p className="text-sm text-slate-400">Analyzing your PRD and generating comprehensive test cases</p>
      </div>

      {/* Step indicators */}
      <div className="w-full max-w-sm space-y-2.5">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 shimmer"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <span className="text-base">{step.icon}</span>
            <span className="text-xs text-slate-400 font-medium">{step.label}</span>
            <div className="ml-auto flex gap-0.5">
              {[0, 1, 2].map(j => (
                <span
                  key={j}
                  className="w-1 h-1 rounded-full bg-indigo-400"
                  style={{
                    animation: 'pulse 1.4s ease-in-out infinite',
                    animationDelay: `${(i * 0.4) + (j * 0.2)}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
