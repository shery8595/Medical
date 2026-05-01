export function SponsorAnalytics() {
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
          <img alt="User Profile" className="w-10 h-10 rounded-full border border-outline-variant/15 object-cover" src="https://images.unsplash.com/photo-1594824436998-dded4e6fe4b5?q=80&w=256&auto=format&fit=crop" referrerPolicy="no-referrer" />
        </div>
      </header>

      <main className="p-8 md:p-12 flex-1 flex flex-col gap-12 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-background tracking-tight">Sponsor Analytics</h2>
            <p className="font-body text-on-surface-variant mt-2 text-lg">Overview of active clinical trials and participant metrics.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-outline-variant/15 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-label text-sm font-semibold text-on-surface-variant">Total Trials</span>
              <div className="bg-primary-container/10 p-2 rounded-full">
                <span className="material-symbols-outlined text-primary text-xl">chip_extraction</span>
              </div>
            </div>
            <span className="font-mono text-3xl font-medium text-on-background">12</span>
            <span className="font-label text-xs text-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +2 this quarter
            </span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-outline-variant/15 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-label text-sm font-semibold text-on-surface-variant">Total Applicants</span>
              <div className="bg-primary-container/10 p-2 rounded-full">
                <span className="material-symbols-outlined text-primary text-xl">group</span>
              </div>
            </div>
            <span className="font-mono text-3xl font-medium text-on-background">3,492</span>
            <span className="font-label text-xs text-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +15% vs last month
            </span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-outline-variant/15 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-label text-sm font-semibold text-on-surface-variant">Acceptance Rate</span>
              <div className="bg-primary-container/10 p-2 rounded-full">
                <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
              </div>
            </div>
            <span className="font-mono text-3xl font-medium text-on-background">18.4%</span>
            <span className="font-label text-xs text-on-surface-variant font-medium flex items-center gap-1">
              Highly selective cohort
            </span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-outline-variant/15 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-surface-container-low opacity-50 z-0"></div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-label text-sm font-semibold text-on-surface-variant">Total ETH Distributed</span>
              <div className="bg-primary-container/10 p-2 rounded-full">
                <span className="material-symbols-outlined text-primary text-xl">payments</span>
              </div>
            </div>
            <span className="font-mono text-3xl font-medium text-on-background relative z-10">45.20 <span className="text-lg text-on-surface-variant">ETH</span></span>
            <span className="font-label text-xs text-primary font-medium flex items-center gap-1 relative z-10">
              <span className="material-symbols-outlined text-sm">verified</span> Smart Contract Verified
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-outline-variant/15 flex flex-col">
            <h3 className="font-headline text-lg font-semibold text-on-background mb-8">Applicants per Trial</h3>
            <div className="flex-1 flex items-end gap-4 h-64 border-b border-outline-variant/30 pb-4">
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-surface-container-high rounded-t-[4px] relative h-[40%] group-hover:bg-primary-container/50 transition-colors"></div>
                <span className="font-mono text-xs text-on-surface-variant">TR-01</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-surface-container-high rounded-t-[4px] relative h-[75%] group-hover:bg-primary-container/50 transition-colors"></div>
                <span className="font-mono text-xs text-on-surface-variant">TR-02</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-primary rounded-t-[4px] relative h-[95%] shadow-[0_0_12px_rgba(0,104,95,0.3)]"></div>
                <span className="font-mono text-xs text-primary font-semibold">TR-03</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-surface-container-high rounded-t-[4px] relative h-[30%] group-hover:bg-primary-container/50 transition-colors"></div>
                <span className="font-mono text-xs text-on-surface-variant">TR-04</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-surface-container-high rounded-t-[4px] relative h-[60%] group-hover:bg-primary-container/50 transition-colors"></div>
                <span className="font-mono text-xs text-on-surface-variant">TR-05</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-surface-container-high rounded-t-[4px] relative h-[45%] group-hover:bg-primary-container/50 transition-colors"></div>
                <span className="font-mono text-xs text-on-surface-variant">TR-06</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-outline-variant/15 flex flex-col">
            <h3 className="font-headline text-lg font-semibold text-on-background mb-6">Milestone Progress</h3>
            <div className="flex flex-col gap-6 relative before:absolute before:inset-y-2 before:left-3 before:w-0.5 before:bg-surface-container-high">
              <div className="relative pl-10 flex flex-col gap-1">
                <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-surface-container-lowest z-10"></div>
                <span className="font-label text-sm font-semibold text-on-background">Phase 1: Recruitment</span>
                <span className="font-label text-xs text-on-surface-variant">100% Completed</span>
              </div>
              <div className="relative pl-10 flex flex-col gap-1">
                <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-surface-container-lowest z-10 animate-pulse"></div>
                <span className="font-label text-sm font-semibold text-primary">Phase 2: Dosing</span>
                <span className="font-label text-xs text-primary">In Progress (45%)</span>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary w-[45%] rounded-full"></div>
                </div>
              </div>
              <div className="relative pl-10 flex flex-col gap-1">
                <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-surface-variant ring-4 ring-surface-container-lowest z-10"></div>
                <span className="font-label text-sm font-semibold text-on-surface-variant opacity-60">Phase 3: Observation</span>
                <span className="font-label text-xs text-on-surface-variant opacity-60">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-secondary-container p-8 rounded-[1.5rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col md:flex-row items-center justify-between gap-8 mt-4 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-secondary-fixed opacity-50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="bg-surface-container-lowest/50 p-4 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-on-secondary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-headline text-xl font-bold text-on-secondary-container">Encrypted Data Pool</h3>
              <p className="font-body text-sm text-on-secondary-container/80 mt-1">Zero-Knowledge proven applicant records awaiting decryption.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-on-secondary-container">2,104</span>
                <span className="font-label text-xs px-2 py-0.5 bg-surface-container-lowest/30 rounded-full text-on-secondary-container">Records Sealed</span>
              </div>
            </div>
          </div>
          <button className="relative z-10 whitespace-nowrap bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-headline font-semibold shadow-[0px_12px_32px_rgba(0,104,95,0.2)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">key</span> Request Decrypt
          </button>
        </div>
      </main>
    </div>
  );
}
