export default function StatsBar({ testCases }) {
  if (!testCases || testCases.length === 0) return null

  const counts = { Positive: 0, Negative: 0, Boundary: 0, Edge: 0, Recovery: 0 }
  testCases.forEach(tc => {
    const t = tc.test_type
    if (counts[t] !== undefined) counts[t]++
  })

  const total = testCases.length
  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0

  const stats = [
    {
      label: 'Total Tests',
      value: total,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Positive',
      value: counts.Positive,
      sub: `${pct(counts.Positive)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Negative',
      value: counts.Negative,
      sub: `${pct(counts.Negative)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      label: 'Boundary',
      value: counts.Boundary,
      sub: `${pct(counts.Boundary)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      ),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Edge',
      value: counts.Edge,
      sub: `${pct(counts.Edge)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Recovery',
      value: counts.Recovery,
      sub: `${pct(counts.Recovery)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ),
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`glass-card p-4 border ${s.border} animate-fade-in`}
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-slate-500 mt-0.5">{s.sub} of total</p>}
            </div>
            <div className={`w-8 h-8 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center ${s.color}`}>
              {s.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
