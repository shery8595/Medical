export function PatientConsentLogs() {
  return (
    <div className="flex flex-col h-[100dvh] overflow-y-auto">
      <header className="bg-[#f7f9fb]/80 backdrop-blur-xl sticky top-0 z-40 bg-slate-50 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex justify-between items-center px-8 py-4 w-full">
        <div className="flex items-center gap-4">
          <h2 className="font-headline tracking-tight text-xl font-bold text-teal-700">Clinical Sanctuary</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input className="pl-10 pr-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim/50 w-64 text-on-surface placeholder:text-outline transition-all" placeholder="Search parameters..." type="text" />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:text-teal-600 transition-colors rounded-full hover:bg-surface-container-low">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:text-teal-600 transition-colors rounded-full hover:bg-surface-container-low">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </button>
          </div>
          <button className="bg-primary text-on-primary font-label font-semibold text-sm px-5 py-2 rounded-full hover:bg-primary-container transition-colors shadow-sm">
            Connect Wallet
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 md:p-12 lg:px-16">
        <div className="mb-10">
          <h1 className="font-headline text-4xl font-semibold text-on-surface mb-2">Consent Logs</h1>
          <p className="font-body text-on-surface-variant text-lg max-w-2xl">Manage your cryptographic proofs and clinical trial access permissions.</p>
        </div>

        {/* Soft Amber Banner */}
        <div className="bg-tertiary-fixed rounded-xl p-6 mb-12 flex items-start gap-4 border border-tertiary-fixed-dim/50">
          <div className="mt-0.5">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
          </div>
          <div>
            <h3 className="font-headline font-semibold text-on-tertiary-fixed-variant text-lg mb-1">Cryptographic Finality</h3>
            <p className="font-body text-on-tertiary-fixed-variant/80 text-sm leading-relaxed">
              Consent is encrypted on-chain. Revoking sets your consent to encrypted false. This action is immutable and immediately severs data access for the respective sponsor.
            </p>
          </div>
        </div>

        {/* Main Data Canvas */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] mb-12">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 pb-4 mb-4 text-xs font-label font-semibold text-outline uppercase tracking-wider">
            <div className="col-span-12 md:col-span-5">Trial Name</div>
            <div className="col-span-4 md:col-span-3">Date Granted</div>
            <div className="col-span-4 md:col-span-2">Status</div>
            <div className="col-span-4 md:col-span-2 text-right">Action</div>
          </div>

          {/* Log Entry 1 */}
          <div className="grid grid-cols-12 gap-4 items-center py-5 transition-colors hover:bg-surface-container-low rounded-lg -mx-4 px-4 group">
            <div className="col-span-12 md:col-span-5">
              <h4 className="font-headline font-semibold text-on-surface text-base">Neurological Pathway Study Alpha</h4>
              <p className="font-mono text-xs text-outline mt-1 truncate max-w-[80%]">ID: 0x8F3b...c9A1</p>
            </div>
            <div className="col-span-4 md:col-span-3">
              <span className="font-mono text-sm text-on-surface-variant">2023.10.15</span>
              <p className="font-label text-xs text-outline mt-0.5">14:32 UTC</p>
            </div>
            <div className="col-span-4 md:col-span-2 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed-dim/20 text-on-primary-fixed-variant font-label text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span>
                Active
              </span>
            </div>
            <div className="col-span-4 md:col-span-2 flex justify-end">
              <button className="border border-error text-error hover:bg-error-container hover:text-on-error-container rounded-full px-4 py-1.5 font-label text-xs font-semibold transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                Revoke Consent
              </button>
            </div>
          </div>

          <div className="h-2 w-full"></div>

          {/* Log Entry 2 */}
          <div className="grid grid-cols-12 gap-4 items-center py-5 transition-colors hover:bg-surface-container-low rounded-lg -mx-4 px-4 group">
            <div className="col-span-12 md:col-span-5">
              <h4 className="font-headline font-semibold text-on-surface text-base opacity-75">Cardio-Metabolic Baseline (Phase II)</h4>
              <p className="font-mono text-xs text-outline mt-1 truncate max-w-[80%] opacity-75">ID: 0x2A1c...e7B4</p>
            </div>
            <div className="col-span-4 md:col-span-3">
              <span className="font-mono text-sm text-on-surface-variant opacity-75">2023.08.02</span>
              <p className="font-label text-xs text-outline mt-0.5 opacity-75">09:15 UTC</p>
            </div>
            <div className="col-span-4 md:col-span-2 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">block</span>
                Revoked
              </span>
            </div>
            <div className="col-span-4 md:col-span-2 flex justify-end">
              <button className="border border-outline-variant text-outline-variant cursor-not-allowed rounded-full px-4 py-1.5 font-label text-xs font-semibold transition-colors">
                Revoked
              </button>
            </div>
          </div>

          <div className="h-2 w-full"></div>

          {/* Log Entry 3 */}
          <div className="grid grid-cols-12 gap-4 items-center py-5 transition-colors hover:bg-surface-container-low rounded-lg -mx-4 px-4 group">
            <div className="col-span-12 md:col-span-5">
              <h4 className="font-headline font-semibold text-on-surface text-base">Longevity Genomics Registry</h4>
              <p className="font-mono text-xs text-outline mt-1 truncate max-w-[80%]">ID: 0x9D4e...f2C8</p>
            </div>
            <div className="col-span-4 md:col-span-3">
              <span className="font-mono text-sm text-on-surface-variant">2023.11.28</span>
              <p className="font-label text-xs text-outline mt-0.5">18:45 UTC</p>
            </div>
            <div className="col-span-4 md:col-span-2 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed-dim/20 text-on-primary-fixed-variant font-label text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span>
                Active
              </span>
            </div>
            <div className="col-span-4 md:col-span-2 flex justify-end">
              <button className="border border-error text-error hover:bg-error-container hover:text-on-error-container rounded-full px-4 py-1.5 font-label text-xs font-semibold transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                Revoke Consent
              </button>
            </div>
          </div>
        </div>

        <div className="h-16"></div>
      </main>
    </div>
  );
}
