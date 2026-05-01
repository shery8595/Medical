export function SponsorActiveTrials() {
  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-y-auto relative z-0 bg-background text-on-background">
      <header className="bg-surface/80 backdrop-blur-xl text-primary font-headline tracking-tight docked full-width top-0 sticky z-40 border-b border-surface-variant/30 flex justify-between items-center px-8 py-4 w-full">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-primary block md:hidden">Clinical Sanctuary</span>
          <h1 className="text-2xl font-semibold text-on-background hidden md:block">Active Trials Management</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-2 ring-1 ring-surface-variant focus-within:ring-primary-fixed-dim focus-within:ring-2 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant w-48 outline-none" placeholder="Search trials..." type="text"/>
          </div>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </button>
          <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full px-6 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity hidden md:flex items-center gap-2 shadow-[0px_12px_32px_rgba(30,41,59,0.04)]">
            <span className="material-symbols-outlined text-sm">add</span> Create New Trial
          </button>
          <img alt="User Profile" className="w-10 h-10 rounded-full border border-surface-variant object-cover" src="https://images.unsplash.com/photo-1594824436998-dded4e6fe4b5?q=80&w=256&auto=format&fit=crop" referrerPolicy="no-referrer"/>
        </div>
      </header>

      <main className="flex-1 p-8 pt-12 overflow-x-hidden max-w-7xl mx-auto w-full">
        <button className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full px-6 py-4 font-semibold text-base hover:opacity-90 transition-opacity md:hidden flex items-center justify-center gap-2 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] mb-8">
          <span className="material-symbols-outlined">add</span> Create New Trial
        </button>

        <div className="bg-surface-container-lowest rounded-[1.5rem] shadow-[0px_12px_32px_rgba(30,41,59,0.04)] p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-xl font-headline font-semibold text-on-background">Current Portfolio</h2>
              <p className="text-sm text-on-surface-variant mt-1">Manage and monitor your active clinical programs.</p>
            </div>
            <div className="flex gap-2">
              <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:bg-surface-container-low px-3 py-1.5 rounded-full transition-colors">
                <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="hidden lg:grid grid-cols-12 gap-4 text-xs font-semibold text-on-surface-variant border-b border-surface-variant pb-3 px-4 uppercase tracking-wider">
              <div className="col-span-12 md:col-span-3">Trial Name</div>
              <div className="col-span-4 md:col-span-1">Phase</div>
              <div className="col-span-4 md:col-span-2">Timeline</div>
              <div className="col-span-4 md:col-span-1">Applicants</div>
              <div className="col-span-6 md:col-span-2">Pool Funded</div>
              <div className="col-span-3 md:col-span-1">Status</div>
              <div className="col-span-3 md:col-span-2 text-right">Actions</div>
            </div>

            <div className="bg-surface rounded-xl p-5 hover:bg-surface-container-low transition-colors duration-200 lg:grid lg:grid-cols-12 lg:items-center gap-4 flex flex-col relative group">
              <div className="col-span-12 lg:col-span-3">
                <div className="font-semibold text-on-background text-base">Neuropathy Sub-Q Eval</div>
                <div className="text-xs text-on-surface-variant font-mono mt-1">ID: TR-8921-A</div>
              </div>
              <div className="col-span-1 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Phase:</span>
                <span className="text-sm font-medium text-on-surface">Phase II</span>
              </div>
              <div className="col-span-2 flex flex-col text-sm mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden mb-1">Timeline:</span>
                <span className="text-on-surface">Oct 12, 2023</span>
                <span className="text-on-surface-variant text-xs">to Dec 01, 2024</span>
              </div>
              <div className="col-span-1 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Applicants:</span>
                <span className="text-sm font-semibold text-primary">142</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Funded:</span>
                <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="font-mono text-sm text-on-surface">12.5 ETH</span>
                </div>
              </div>
              <div className="col-span-1 mt-3 lg:mt-0">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#def7ec] text-[#03543f]">Active</span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1 mt-4 lg:mt-0 border-t lg:border-t-0 border-surface-variant/30 pt-3 lg:pt-0">
                <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all" title="View Details">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/5 rounded-full transition-all" title="Fund Pool">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-all" title="Deactivate">
                  <span className="material-symbols-outlined text-[20px]">pause_circle</span>
                </button>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-5 hover:bg-surface-container-low transition-colors duration-200 lg:grid lg:grid-cols-12 lg:items-center gap-4 flex flex-col relative group">
              <div className="col-span-12 lg:col-span-3">
                <div className="font-semibold text-on-background text-base">Cardiac Rhythm Study</div>
                <div className="text-xs text-on-surface-variant font-mono mt-1">ID: TR-7742-B</div>
              </div>
              <div className="col-span-1 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Phase:</span>
                <span className="text-sm font-medium text-on-surface">Phase III</span>
              </div>
              <div className="col-span-2 flex flex-col text-sm mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden mb-1">Timeline:</span>
                <span className="text-on-surface">Jan 05, 2024</span>
                <span className="text-on-surface-variant text-xs">to Jun 30, 2025</span>
              </div>
              <div className="col-span-1 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Applicants:</span>
                <span className="text-sm font-semibold text-primary">89</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Funded:</span>
                <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="font-mono text-sm text-on-surface">45.0 ETH</span>
                </div>
              </div>
              <div className="col-span-1 mt-3 lg:mt-0">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#def7ec] text-[#03543f]">Active</span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1 mt-4 lg:mt-0 border-t lg:border-t-0 border-surface-variant/30 pt-3 lg:pt-0">
                <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all" title="View Details">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/5 rounded-full transition-all" title="Fund Pool">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-all" title="Deactivate">
                  <span className="material-symbols-outlined text-[20px]">pause_circle</span>
                </button>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-5 hover:bg-surface-container-low transition-colors duration-200 lg:grid lg:grid-cols-12 lg:items-center gap-4 flex flex-col relative group opacity-80">
              <div className="col-span-12 lg:col-span-3">
                <div className="font-semibold text-on-background text-base">Pediatric Asthma Observational</div>
                <div className="text-xs text-on-surface-variant font-mono mt-1">ID: TR-9011-C</div>
              </div>
              <div className="col-span-1 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Phase:</span>
                <span className="text-sm font-medium text-on-surface">Phase I</span>
              </div>
              <div className="col-span-2 flex flex-col text-sm mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden mb-1">Timeline:</span>
                <span className="text-on-surface">TBD</span>
                <span className="text-on-surface-variant text-xs">--</span>
              </div>
              <div className="col-span-1 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Applicants:</span>
                <span className="text-sm font-semibold text-on-surface-variant">0</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-2 lg:mt-0">
                <span className="text-xs text-on-surface-variant lg:hidden w-20">Funded:</span>
                <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                  <span className="font-mono text-sm text-on-surface-variant">0.00 ETH</span>
                </div>
              </div>
              <div className="col-span-1 mt-3 lg:mt-0">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">Draft</span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1 mt-4 lg:mt-0 border-t lg:border-t-0 border-surface-variant/30 pt-3 lg:pt-0">
                <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all" title="Edit Draft">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/5 rounded-full transition-all" title="Fund Pool">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-all" title="Delete">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
