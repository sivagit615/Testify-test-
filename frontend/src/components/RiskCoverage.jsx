import React from 'react';

export default function RiskCoverage({ conflicts, coverageAudit, findings }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Conflicts Radar */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
            <span className="text-rose-400">⚡</span> Conflicts Radar
          </h2>
          {conflicts && conflicts.length > 0 ? (
            <div className="space-y-3">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3">
                  <span className="text-rose-400 mt-0.5">⚠️</span>
                  <p className="text-sm text-slate-300">{conflict}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <span>✅</span> No conflicts detected in requirements.
            </div>
          )}
        </div>

        {/* Coverage Audit & Gaps */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
            <span className="text-amber-400">🛡️</span> Coverage Audit & Gaps
          </h2>
          {coverageAudit && coverageAudit.length > 0 ? (
            <div className="space-y-3">
              {coverageAudit.map((gap, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                  <span className="text-amber-400 mt-0.5">🔍</span>
                  <p className="text-sm text-slate-300">{gap}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm">
              No coverage gaps identified.
            </div>
          )}
        </div>
      </div>

      {/* Risk Prioritization Order */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <span className="text-cyan-400">🎯</span> Risk Prioritization (Audit Findings)
        </h2>
        {findings && findings.length > 0 ? (
          <div className="space-y-3">
            {findings.map((finding, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/50 flex flex-col gap-2 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-sm">{finding.issue}</span>
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wide
                    ${finding.risk_level?.toLowerCase() === 'high' ? 'bg-rose-500/20 text-rose-400' :
                      finding.risk_level?.toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'}`}>
                    {finding.risk_level} Risk
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  <span className="text-cyan-500/70 mr-1">Suggestion:</span>{finding.suggestion}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No prioritized risk findings available.</p>
        )}
      </div>
    </div>
  );
}
