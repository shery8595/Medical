export function PatientResults() {
  return (
    <div className="flex flex-col h-[100dvh] overflow-y-auto w-full relative z-0 bg-background text-on-background">
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-12 py-12 md:py-20 space-y-12 mb-16">
        {/* Page Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-secondary mb-2">
          <span className="material-symbols-outlined">verified_user</span>
          <span className="font-mono text-xs uppercase tracking-widest font-semibold">Identity Verified</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tight">Clinical Results</h1>
        <p className="text-lg text-on-surface-variant font-body max-w-2xl leading-relaxed">
          Access your secured trial outcomes. Data remains shielded until explicitly decrypted by your local key.
        </p>
      </header>

      {/* Info Box */}
      <div className="bg-secondary-fixed/50 rounded-lg p-6 flex items-start gap-4 ghost-border">
        <div className="p-2 bg-secondary/10 rounded-full mt-1">
          <span className="material-symbols-outlined text-secondary">lock_person</span>
        </div>
        <div>
          <h3 className="font-headline font-semibold text-on-secondary-container text-lg mb-1">Zero-Knowledge Proof Active</h3>
          <p className="text-on-secondary-container/80 font-body text-sm leading-relaxed">
            Results are encrypted. Only your ephemeral key can decrypt them.
          </p>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-6 pb-24">
        {/* Card 1: Accepted */}
        <article className="bg-surface-container-lowest rounded-lg p-8 ambient-shadow ghost-border relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container opacity-50"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary font-mono text-xs rounded-full font-semibold tracking-wide">TRIAL-DB-309</span>
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-[#dcfce7] text-[#166534] rounded-full">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Accepted
                </span>
              </div>
              <h2 className="text-2xl font-headline font-semibold text-on-surface">Diabetes Phase III</h2>
              <div className="flex items-center gap-4 text-sm text-on-surface-variant font-body">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> Concluded Oct 24</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">science</span> Metabolic Cohort A</span>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">key</span>
                Decrypt Result
              </button>
            </div>
          </div>
        </article>

        {/* Card 2: Pending */}
        <article className="bg-surface-container-lowest rounded-lg p-8 ambient-shadow ghost-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-surface-variant to-surface-dim opacity-50"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-surface-variant/50 text-on-surface-variant font-mono text-xs rounded-full font-semibold tracking-wide">TRIAL-CV-112</span>
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-[#fef3c7] text-[#92400e] rounded-full">
                  <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                  Pending
                </span>
              </div>
              <h2 className="text-2xl font-headline font-semibold text-on-surface">Cardio Study</h2>
              <div className="flex items-center gap-4 text-sm text-on-surface-variant font-body">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">update</span> Est. Nov 12</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">monitor_heart</span> Telemetry Review</span>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button className="w-full md:w-auto px-6 py-3 bg-surface-container-high text-on-surface-variant/50 rounded-full font-label font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2" disabled>
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Awaiting Data
              </button>
            </div>
          </div>
        </article>
      </div>
      </div>
      <div className="h-16 w-full"></div>
    </div>
  );
}
