import React from 'react';

export default function TestMatrix({ testCases }) {
  if (!testCases || testCases.length === 0) {
    return <div className="text-slate-500 p-6 text-center">No test cases generated.</div>;
  }

  const getTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'positive': return 'badge-positive';
      case 'negative': return 'badge-negative';
      case 'boundary': return 'badge-boundary';
      case 'edge': return 'badge-edge';
      case 'recovery': return 'badge-recovery';
      default: return 'bg-slate-700 text-slate-300 rounded-full px-2 py-0.5 text-xs';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-24">ID</th>
                <th className="w-1/3">Title & Type</th>
                <th className="w-1/3">Steps</th>
                <th>Expected Result</th>
                <th className="w-32">Source</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((tc, idx) => (
                <tr key={tc.test_id || idx}>
                  <td className="font-mono text-cyan-400 font-semibold">{tc.test_id}</td>
                  <td>
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-medium text-slate-200">{tc.title}</span>
                      <span className={getTypeBadge(tc.test_type)}>{tc.test_type}</span>
                    </div>
                  </td>
                  <td>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      {tc.steps?.map((step, sIdx) => (
                        <li key={sIdx} className="text-sm">{step}</li>
                      ))}
                    </ol>
                  </td>
                  <td className="text-sm text-slate-300">{tc.expected_result}</td>
                  <td>
                    {tc.source_citation ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-xs">
                        {tc.source_citation}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
