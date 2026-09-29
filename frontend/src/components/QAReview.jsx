import React, { useState, useEffect } from 'react';

export default function QAReview({ testCases, onStatusChange }) {
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const initialStatuses = {};
    testCases?.forEach(tc => {
      initialStatuses[tc.test_id] = 'Pending';
    });
    setStatuses(initialStatuses);
  }, [testCases]);

  const toggleStatus = (id, newStatus) => {
    const updated = { ...statuses, [id]: newStatus };
    setStatuses(updated);
    if (onStatusChange) onStatusChange(updated);
  };

  if (!testCases || testCases.length === 0) {
    return <div className="text-slate-500 p-6 text-center">No test cases to review.</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
          <span className="text-indigo-400">✔️</span> QA Review Queue
        </h2>
        
        <div className="space-y-4">
          {testCases.map((tc, idx) => {
            const status = statuses[tc.test_id] || 'Pending';
            return (
              <div key={tc.test_id || idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-indigo-500/30 transition-colors">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-cyan-400 font-semibold text-sm">{tc.test_id}</span>
                    <span className="font-medium text-slate-200">{tc.title}</span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-1">{tc.expected_result}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => toggleStatus(tc.test_id, 'Pending')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${status === 'Pending' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Pending
                  </button>
                  <button 
                    onClick={() => toggleStatus(tc.test_id, 'Approved')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-emerald-400/70'}`}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => toggleStatus(tc.test_id, 'Flagged')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${status === 'Flagged' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(225,29,72,0.2)]' : 'text-slate-500 hover:text-rose-400/70'}`}
                  >
                    Flag
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
