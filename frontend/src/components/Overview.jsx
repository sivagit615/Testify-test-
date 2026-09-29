import React from 'react';

export default function Overview({ summary, overallRisk, coverageScore, businessRules, auditFindings }) {
  const getRiskStyles = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.3)]';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Executive Summary */}
        <div className="col-span-1 md:col-span-2 glass-card p-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
            <span className="text-cyan-400">📝</span> Executive Summary
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">{summary || 'No summary available.'}</p>
        </div>

        {/* Key Metrics */}
        <div className="glass-card p-6 flex flex-col justify-center gap-6">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Overall Risk</p>
            <div className={`inline-flex px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide transition-all ${getRiskStyles(overallRisk)}`}>
              {overallRisk || 'Unknown'}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Coverage Score</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black gradient-text">{coverageScore || 0}</span>
              <span className="text-slate-500 font-medium mb-1">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Rules */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <span className="text-indigo-400">⚖️</span> Extracted Business Rules
        </h2>
        {businessRules && businessRules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {businessRules.map((rule, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                <span className="text-indigo-400 text-xs font-mono font-bold pt-0.5">R{idx + 1}</span>
                <p className="text-sm text-slate-300">{rule}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No business rules extracted.</p>
        )}
      </div>
    </div>
  );
}
