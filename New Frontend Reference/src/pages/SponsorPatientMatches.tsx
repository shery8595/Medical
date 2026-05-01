export function SponsorPatientMatches() {
  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-y-auto relative z-0 bg-background text-on-background">
      <header className="bg-[#f7f9fb]/80 backdrop-blur-xl docked full-width top-0 sticky z-40 border-b border-surface-variant/30 flex justify-between items-center px-8 py-4 w-full">
        <div className="text-xl font-bold text-teal-700 font-headline tracking-tight md:hidden">
          Clinical Sanctuary
        </div>
        <div className="hidden md:block"></div> 
        <div className="flex items-center gap-6">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input className="bg-surface-container-highest text-on-surface rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim border-none w-64" placeholder="Search trials..." type="text"/>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-teal-600 transition-colors scale-95 duration-200 ease-in-out">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-slate-500 hover:text-teal-600 transition-colors scale-95 duration-200 ease-in-out">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </button>
            <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
              Connect Wallet
            </button>
            <img alt="User Profile" className="w-8 h-8 rounded-full border-2 border-surface-container-highest" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=256&auto=format&fit=crop" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      <main className="p-8 lg:p-12 xl:px-16 max-w-7xl mx-auto w-full">
        <div className="bg-secondary-container/20 border-l-4 border-secondary rounded-r-lg p-6 mb-12 flex items-start gap-4">
          <div className="bg-secondary text-on-secondary rounded-full p-2 mt-0.5">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
          </div>
          <div>
            <h2 className="text-on-secondary-container font-headline font-semibold text-lg mb-1">Zero-Knowledge Protected Environment</h2>
            <p className="text-on-surface-variant font-body text-sm leading-relaxed">
              Patient identities are protected by Semaphore zero-knowledge proofs. Data displayed below contains no personally identifiable information (PII) or wallet addresses.
            </p>
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-headline font-bold text-on-background tracking-tight mb-2">Patient Matches</h1>
          <p className="text-on-surface-variant font-body text-lg">Review anonymous applicants matching your clinical trial criteria.</p>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-surface-variant">
            <h3 className="text-xl font-headline font-semibold text-primary">Oncology Phase II (Alpha-T)</h3>
            <span className="bg-surface-container-highest text-on-surface px-3 py-1 rounded-full text-xs font-semibold tracking-wide">3 PENDING</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-outline font-semibold uppercase tracking-wider mb-1 block">Nullifier ID</span>
                  <div className="font-mono text-on-surface bg-surface-container px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-2">
                    0x9a7...f4B2
                    <span className="material-symbols-outlined text-[16px] text-secondary cursor-pointer hover:text-primary transition-colors">content_copy</span>
                  </div>
                </div>
                <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span> Application Received
                </span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant font-medium">Encrypted Match Score</span>
                  <span className="text-primary font-mono font-semibold">94%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-fixed-dim to-primary rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-end mt-auto pt-4">
                <div>
                  <span className="text-xs text-outline font-semibold uppercase tracking-wider block mb-1">Applied</span>
                  <span className="text-sm text-on-surface font-medium">Oct 24, 2023</span>
                </div>
                <div className="flex gap-3">
                  <button className="text-on-surface-variant bg-surface-container hover:bg-surface-container-high px-4 py-2 rounded-full text-sm font-semibold transition-colors">Reject</button>
                  <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full text-sm font-semibold hover:shadow-md transition-all">Accept Match</button>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-outline font-semibold uppercase tracking-wider mb-1 block">Nullifier ID</span>
                  <div className="font-mono text-on-surface bg-surface-container px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-2">
                    0x3c1...e9A0
                    <span className="material-symbols-outlined text-[16px] text-secondary cursor-pointer hover:text-primary transition-colors">content_copy</span>
                  </div>
                </div>
                <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span> Application Received
                </span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant font-medium">Encrypted Match Score</span>
                  <span className="text-primary font-mono font-semibold">88%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-fixed-dim to-primary rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-end mt-auto pt-4">
                <div>
                  <span className="text-xs text-outline font-semibold uppercase tracking-wider block mb-1">Applied</span>
                  <span className="text-sm text-on-surface font-medium">Oct 23, 2023</span>
                </div>
                <div className="flex gap-3">
                  <button className="text-on-surface-variant bg-surface-container hover:bg-surface-container-high px-4 py-2 rounded-full text-sm font-semibold transition-colors">Reject</button>
                  <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full text-sm font-semibold hover:shadow-md transition-all">Accept Match</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
