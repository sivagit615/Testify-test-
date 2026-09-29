import React, { useState } from 'react';

export default function ExportView({ result }) {
  const [copiedJira, setCopiedJira] = useState(false);

  if (!result || !result.test_cases) {
    return <div className="text-slate-500 p-6 text-center">No data available for export.</div>;
  }

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "testify_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadCSV = () => {
    const headers = ["Test ID", "Title", "Type", "Expected Result", "Source Citation", "Steps"];
    const rows = result.test_cases.map(tc => [
      tc.test_id || "",
      `"${(tc.title || "").replace(/"/g, '""')}"`,
      tc.test_type || "",
      `"${(tc.expected_result || "").replace(/"/g, '""')}"`,
      tc.source_citation || "",
      `"${(tc.steps || []).join('\n').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", encodeURI(csvContent));
    downloadAnchorNode.setAttribute("download", "testify_export.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const copyJiraPayload = () => {
    let markdown = `# UAT Test Cases\n\n`;
    result.test_cases.forEach(tc => {
      markdown += `## ${tc.test_id}: ${tc.title}\n`;
      markdown += `**Type:** ${tc.test_type} | **Source:** ${tc.source_citation || 'N/A'}\n\n`;
      markdown += `### Steps:\n`;
      tc.steps?.forEach((step, i) => {
        markdown += `${i + 1}. ${step}\n`;
      });
      markdown += `\n### Expected Result:\n${tc.expected_result}\n\n---\n\n`;
    });

    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedJira(true);
      setTimeout(() => setCopiedJira(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-8 text-center max-w-2xl mx-auto mt-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🚀</span>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Export Your Test Suite</h2>
        <p className="text-slate-400 mb-8 text-sm">Download your generated artifacts to integrate seamlessly with your ALM tools.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={downloadJSON} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-slate-900/80 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
            <span className="font-semibold text-slate-200 text-sm">Download JSON</span>
          </button>
          
          <button onClick={downloadCSV} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-slate-900/80 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
            <span className="font-semibold text-slate-200 text-sm">Download CSV</span>
          </button>
          
          <button onClick={copyJiraPayload} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-slate-900/80 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group relative overflow-hidden">
            {copiedJira ? (
              <div className="absolute inset-0 bg-indigo-600 flex flex-col items-center justify-center gap-2 animate-fade-in text-white">
                <span className="text-2xl">✅</span>
                <span className="font-bold text-sm">Copied!</span>
              </div>
            ) : (
              <>
                <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                <span className="font-semibold text-slate-200 text-sm">Copy Jira Payload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
