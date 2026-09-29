import { useState } from 'react'

function copyToClipboard(text, setCopied) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  })
}

function exportCSV(testCases) {
  const headers = ['Test ID', 'Title', 'Test Type', 'Preconditions', 'Steps', 'Expected Result', 'Source Citation']
  const rows = testCases.map(tc => [
    tc.test_id,
    tc.title,
    tc.test_type,
    tc.preconditions,
    Array.isArray(tc.steps) ? tc.steps.join(' | ') : tc.steps,
    tc.expected_result,
    tc.source_citation || '',
  ])
  const escape = val => `"${String(val ?? '').replace(/"/g, '""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `testify-uat-matrix-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ExportPanel({ result }) {
  const [copiedJSON, setCopiedJSON] = useState(false)
  const [copiedJira, setCopiedJira] = useState(false)

  if (!result?.test_cases || result.test_cases.length === 0) return null

  const jiraPayload = result.test_cases.map(tc => ({
    fields: {
      summary: `[${tc.test_id}] ${tc.title}`,
      issuetype: { name: 'Test' },
      description: [
        `*Test Type:* ${tc.test_type}`,
        `*Preconditions:* ${tc.preconditions}`,
        `*Steps:*\n${(tc.steps || []).map((s, i) => `# ${s}`).join('\n')}`,
        `*Expected Result:* ${tc.expected_result}`,
        `*Source:* ${tc.source_citation || 'N/A'}`,
      ].join('\n\n'),
      labels: ['testify-generated', tc.test_type.toLowerCase()],
    },
  }))

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Multi-Format Export</h2>
            <p className="text-xs text-slate-400">{result.test_cases.length} test cases ready for export</p>
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CSV Export */}
        <button
          onClick={() => exportCSV(result.test_cases)}
          className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-slate-800/40 border border-slate-700/50
                     hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center
                          group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">CSV Download</p>
            <p className="text-xs text-slate-500 mt-0.5">Spreadsheet-ready format</p>
          </div>
        </button>

        {/* JSON Copy */}
        <button
          onClick={() => copyToClipboard(JSON.stringify(result, null, 2), setCopiedJSON)}
          className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-slate-800/40 border border-slate-700/50
                     hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center
                          group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">{copiedJSON ? '✓ Copied!' : 'JSON Payload'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Full structured response</p>
          </div>
        </button>

        {/* Jira Copy */}
        <button
          onClick={() => copyToClipboard(JSON.stringify(jiraPayload, null, 2), setCopiedJira)}
          className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-slate-800/40 border border-slate-700/50
                     hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center
                          group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">{copiedJira ? '✓ Copied!' : 'Jira Tickets'}</p>
            <p className="text-xs text-slate-500 mt-0.5">API-ready ticket payloads</p>
          </div>
        </button>
      </div>
    </div>
  )
}
