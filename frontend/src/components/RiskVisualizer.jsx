export default function RiskVisualizer({ prioritizedFindings, riskScore, riskSummary, coverageAudit, coverageScore, conflicts }) {
  if (!prioritizedFindings || prioritizedFindings.length === 0) return null

  const scoreColor = riskScore >= 70 ? 'text-rose-400' : riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
  const scoreBg = riskScore >= 70 ? 'from-rose-500' : riskScore >= 40 ? 'from-amber-500' : 'from-emerald-500'
  const coverageColor = coverageScore >= 70 ? 'text-emerald-400' : coverageScore >= 40 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Score Card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">Risk Score</h3>
            </div>
            <span className={`text-3xl font-bold ${scoreColor}`}>{riskScore?.toFixed(0) || 0}</span>
          </div>
          {/* Risk bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${scoreBg} to-transparent transition-all duration-1000`}
              style={{ width: `${Math.min(riskScore || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 italic">{riskSummary}</p>
        </div>

        {/* Coverage Score Card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">Coverage Score</h3>
            </div>
            <span className={`text-3xl font-bold ${coverageColor}`}>{coverageScore?.toFixed(0) || 0}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${coverageScore >= 70 ? 'from-emerald-500' : coverageScore >= 40 ? 'from-amber-500' : 'from-rose-500'} to-transparent transition-all duration-1000`}
              style={{ width: `${Math.min(coverageScore || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Test coverage completeness across scenario families</p>
        </div>
      </div>

      {/* Risk Priority Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-100">Risk Prioritization Matrix</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-16">Rank</th>
                <th>Issue</th>
                <th className="w-20">Level</th>
                <th className="w-20">Impact</th>
                <th className="w-24">Exposure</th>
                <th className="w-24">Uncertainty</th>
                <th className="w-20">Score</th>
              </tr>
            </thead>
            <tbody>
              {prioritizedFindings.map((item, i) => (
                <tr key={i} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <td>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                        i < 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                      {item.priority_rank}
                    </span>
                  </td>
                  <td>
                    <p className="text-xs font-medium text-slate-200">{item.issue}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.suggestion}</p>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                      ${item.risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        item.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-sky-500/10 text-sky-400 border-sky-500/30'}`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td><span className="text-xs font-mono text-slate-300">{item.impact_score}</span></td>
                  <td><span className="text-xs font-mono text-slate-300">{item.exposure_score}</span></td>
                  <td><span className="text-xs font-mono text-slate-300">{item.uncertainty_score}</span></td>
                  <td>
                    <span className={`text-xs font-bold ${item.composite_score >= 6 ? 'text-rose-400' : item.composite_score >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {item.composite_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflicts & Coverage Audit side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conflicts */}
        {conflicts && conflicts.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-100">Detected Conflicts</h3>
              <span className="text-xs text-rose-400 font-bold ml-auto">{conflicts.length}</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conflicts.map((c, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-300/80">
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Audit */}
        {coverageAudit && coverageAudit.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-100">Coverage Audit</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {coverageAudit.map((note, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
