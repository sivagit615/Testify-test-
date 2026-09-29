const SAMPLE_PRD = `Product: User Authentication Module

User Stories:
1. As a new user, I want to register with my email and password so I can access the platform.
2. As a registered user, I want to log in with my credentials so I can use the application.
3. As a user, I want to reset my password via email if I forget it.
4. As a user, I want to stay logged in for 30 days unless I manually log out.
5. As an admin, I want to lock accounts after 5 failed login attempts to prevent brute-force attacks.

Business Rules:
- Passwords must be at least 8 characters long.
- Email addresses must be unique in the system.
- Password reset links expire after 24 hours.
- Users must verify their email before accessing premium features.`

export default function PRDInput({ value, onChange, onSubmit, isLoading }) {
  const charCount = value.length
  const maxChars = 10000

  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Card header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-slate-100">PRD / Requirements Input</h2>
          </div>
          <p className="text-xs text-slate-400 ml-9">Paste your Product Requirement Document, user stories, or feature specs below.</p>
        </div>
        <button
          onClick={() => onChange(SAMPLE_PRD)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-lg
                     bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 transition-all duration-200 whitespace-nowrap"
        >
          Load Sample
        </button>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          id="prd-input"
          className="textarea-primary h-72"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your PRD, user stories, acceptance criteria, or feature specifications here...

Example:
As a user, I want to log in with my email and password so I can access my dashboard.
Business Rule: Accounts should lock after 5 failed attempts."
          maxLength={maxChars}
          disabled={isLoading}
        />
        {/* Char counter */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={`text-xs font-mono ${charCount > maxChars * 0.9 ? 'text-amber-400' : 'text-slate-500'}`}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Gemini AI will audit & generate test cases
          </span>
        </div>

        <button
          id="generate-btn"
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing PRD...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate UAT Matrix
            </>
          )}
        </button>
      </div>
    </div>
  )
}
