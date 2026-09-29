import { useState } from 'react'

// ─── Sub-components ───────────────────────────────────────────────────────────

function TestTypeBadge({ type }) {
  const normalised = type?.toLowerCase()
  if (normalised === 'positive') return <span className="badge-positive">✓ Positive</span>
  if (normalised === 'negative') return <span className="badge-negative">✗ Negative</span>
  if (normalised === 'boundary') return <span className="badge-boundary">◈ Boundary</span>
  if (normalised === 'edge') return <span className="badge-edge">⚡ Edge</span>
  if (normalised === 'recovery') return <span className="badge-recovery">↻ Recovery</span>
  return <span className="text-xs text-slate-400">{type}</span>
}

function StepList({ steps }) {
  if (!steps || steps.length === 0)
    return <span className="text-slate-500 text-xs italic">—</span>
  if (typeof steps === 'string')
    return <p className="text-xs leading-relaxed text-slate-300">{steps}</p>
  return (
    <ol className="space-y-1.5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-xs leading-relaxed">
          <span
            className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-800 border border-slate-700
                       text-slate-400 flex items-center justify-center font-mono text-[10px] mt-0.5"
          >
            {i + 1}
          </span>
          <span className="text-slate-300">{step}</span>
        </li>
      ))}
    </ol>
  )
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportToCSV(testCases) {
  const headers = ['Test ID', 'Title', 'Test Type', 'Preconditions', 'Steps', 'Expected Result', 'Source Citation']
  const rows = testCases.map((tc) => [
    tc.test_id,
    tc.title,
    tc.test_type,
    tc.preconditions,
    Array.isArray(tc.steps) ? tc.steps.join(' | ') : tc.steps,
    tc.expected_result,
    tc.source_citation || '',
  ])

  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n')

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

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = ['All', 'Positive', 'Negative', 'Boundary', 'Edge', 'Recovery']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UATMatrix({ testCases, summary }) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  if (!testCases || testCases.length === 0) return null

  const filtered = testCases.filter((tc) => {
    const matchType =
      filter === 'All' || tc.test_type?.toLowerCase() === filter.toLowerCase()
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      tc.title?.toLowerCase().includes(q) ||
      tc.test_id?.toLowerCase().includes(q) ||
      tc.expected_result?.toLowerCase().includes(q) ||
      tc.source_citation?.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const counts = { Positive: 0, Negative: 0, Boundary: 0, Edge: 0, Recovery: 0 }
  testCases.forEach((tc) => {
    if (counts[tc.test_type] !== undefined) counts[tc.test_type]++
  })

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-1.5 0H3.375"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">UAT Test Matrix</h2>
              <p className="text-xs text-slate-400">
                {testCases.length} test case{testCases.length !== 1 ? 's' : ''} generated
              </p>
            </div>
          </div>

          {/* Export button */}
          <button
            id="export-csv-btn"
            onClick={() => exportToCSV(testCases)}
            className="btn-secondary text-xs !py-2 !px-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Type count badges */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="badge-positive">{counts.Positive} Positive</span>
          <span className="badge-negative">{counts.Negative} Negative</span>
          <span className="badge-boundary">{counts.Boundary} Boundary</span>
          <span className="badge-edge">{counts.Edge} Edge</span>
          <span className="badge-recovery">{counts.Recovery} Recovery</span>
        </div>

        {/* AI Summary */}
        {summary && (
          <p className="mt-3 text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-3 italic">
            {summary}
          </p>
        )}

        {/* Filters row */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {/* Search box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              id="matrix-search"
              placeholder="Search by title, ID, result…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700
                         text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1
                         focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                id={`filter-${opt.toLowerCase()}`}
                onClick={() => setFilter(opt)}
                className={`px-3 py-1.5 text-xs font-medium transition-all duration-150
                  ${filter === opt
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-24">Test ID</th>
              <th>Title</th>
              <th className="w-28">Type</th>
              <th className="w-48">Preconditions</th>
              <th className="w-64">Steps</th>
              <th>Expected Result</th>
              <th className="w-48">Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    No test cases match your filter.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tc, i) => (
                <tr
                  key={tc.test_id || i}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 35}ms`, animationFillMode: 'both' }}
                >
                  <td>
                    <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 px-2 py-0.5 rounded whitespace-nowrap">
                      {tc.test_id}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-slate-200 text-xs">{tc.title}</span>
                  </td>
                  <td>
                    <TestTypeBadge type={tc.test_type} />
                  </td>
                  <td>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tc.preconditions || '—'}
                    </p>
                  </td>
                  <td>
                    <StepList steps={tc.steps} />
                  </td>
                  <td>
                    <p className="text-xs text-slate-300 leading-relaxed">{tc.expected_result}</p>
                  </td>
                  <td>
                    <p className="text-xs text-indigo-400/70 italic leading-relaxed">
                      {tc.source_citation || '—'}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Showing{' '}
          <span className="text-slate-300 font-medium">{filtered.length}</span> of{' '}
          <span className="text-slate-300 font-medium">{testCases.length}</span> tests
        </span>
        <button
          onClick={() => exportToCSV(testCases)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download all as CSV
        </button>
      </div>
    </div>
  )
}
