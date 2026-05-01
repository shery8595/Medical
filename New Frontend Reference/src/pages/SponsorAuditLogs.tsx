export function SponsorAuditLogs() {
  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-y-auto relative z-0 bg-background text-on-background">
      <header className="bg-[#f7f9fb]/80 backdrop-blur-xl docked full-width top-0 sticky z-40 border-b border-surface-variant/30 flex justify-between items-center px-8 py-4 w-full">
        <div className="flex items-center gap-4 font-headline tracking-tight">
          <span className="text-xl font-bold text-teal-700 md:hidden">Clinical Sanctuary</span>
        </div>
        <div className="hidden md:flex flex-1"></div>
        <div className="flex items-center gap-6">
          <button className="text-slate-500 font-medium hover:text-teal-600 transition-colors scale-95 duration-200">
            <span className="material-symbols-outlined text-2xl">notifications</span>
          </button>
          <button className="text-slate-500 font-medium hover:text-teal-600 transition-colors scale-95 duration-200">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </button>
          <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full font-semibold text-sm shadow-[0px_12px_32px_rgba(30,41,59,0.04)] hover:opacity-90 transition-opacity">
            Connect Wallet
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
        <div className="mb-16">
          <h2 className="text-4xl font-headline font-semibold text-on-background mb-4">Audit Logs</h2>
          <div className="inline-flex items-center space-x-2 bg-secondary-container/20 px-4 py-2 rounded-full border border-outline-variant/15">
            <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shield_locked</span>
            <p className="text-sm font-medium text-secondary">Logs are stored on-chain and cannot be modified.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col lg:flex-row lg:items-center gap-6 border border-outline-variant/15 hover:bg-surface-container-low transition-colors duration-300">
            <div className="w-48 shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container tracking-wide">ELIGIBILITY_CHECKED</span>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Trial ID</span>
                <span className="text-sm text-on-surface font-semibold">TRL-2024-88X</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Patient Hash</span>
                <span className="text-sm text-on-surface font-mono">0x7a...f92b</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Timestamp</span>
                <span className="text-sm text-on-surface">Oct 24, 09:12 UTC</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Performer</span>
                <span className="text-sm text-on-surface font-mono">0xSpon...44a1</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col lg:flex-row lg:items-center gap-6 border border-outline-variant/15 hover:bg-surface-container-low transition-colors duration-300">
            <div className="w-48 shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-on-primary tracking-wide">CONSENT_GRANTED</span>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Trial ID</span>
                <span className="text-sm text-on-surface font-semibold">TRL-2024-88X</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Patient Hash</span>
                <span className="text-sm text-on-surface font-mono">0x7a...f92b</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Timestamp</span>
                <span className="text-sm text-on-surface">Oct 25, 14:30 UTC</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Performer</span>
                <span className="text-sm text-on-surface font-mono">0xPat...11c9</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col lg:flex-row lg:items-center gap-6 border border-outline-variant/15 hover:bg-surface-container-low transition-colors duration-300">
            <div className="w-48 shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-container text-on-tertiary-container tracking-wide">MILESTONE_COMPLETED</span>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Trial ID</span>
                <span className="text-sm text-on-surface font-semibold">TRL-2023-12A</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Patient Hash</span>
                <span className="text-sm text-on-surface font-mono">0x3c...d881</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Timestamp</span>
                <span className="text-sm text-on-surface">Oct 26, 11:05 UTC</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Performer</span>
                <span className="text-sm text-on-surface font-mono">0xClin...99f0</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col lg:flex-row lg:items-center gap-6 border border-outline-variant/15 hover:bg-surface-container-low transition-colors duration-300">
            <div className="w-48 shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container tracking-wide">REWARDS_DISTRIBUTED</span>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Trial ID</span>
                <span className="text-sm text-on-surface font-semibold">TRL-2023-12A</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Patient Hash</span>
                <span className="text-sm text-on-surface font-mono">0x3c...d881</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Timestamp</span>
                <span className="text-sm text-on-surface">Oct 27, 08:45 UTC</span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-medium mb-1 uppercase tracking-wider">Performer</span>
                <span className="text-sm text-on-surface font-mono">0xSmart...00b4</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button className="text-sm font-semibold text-primary hover:text-primary-container transition-colors tracking-wide flex items-center space-x-2">
            <span>Load Older Logs</span>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </main>
    </div>
  );
}
