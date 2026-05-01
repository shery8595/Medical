export function PatientFindTrials() {
  return (
    <div className="flex flex-col h-[100dvh] overflow-y-auto w-full relative z-0 bg-background text-on-background">
      <header className="bg-[#f7f9fb]/80 backdrop-blur-xl font-['Plus_Jakarta_Sans'] tracking-tight docked full-width top-0 sticky z-40 no-line tonal-transition bg-slate-50 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex justify-between items-center px-8 py-4 w-full">
        <div className="flex-1"></div>
        <div className="flex items-center gap-6">
          <button className="text-slate-500 hover:text-teal-600 transition-colors scale-95 duration-200 ease-in-out p-2 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-500 hover:text-teal-600 transition-colors scale-95 duration-200 ease-in-out p-2 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </button>
          <button className="bg-surface-container-lowest text-primary font-semibold border border-outline-variant/30 rounded-full px-5 py-2.5 text-sm hover:bg-surface-container-low transition-colors shadow-sm">
            Connect Wallet
          </button>
        </div>
      </header>

      <main className="flex-1 px-12 py-16 max-w-7xl mx-auto w-full flex flex-col gap-[3rem]">
        <section className="flex flex-col gap-8">
          <h2 className="font-headline text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">Discover Precision Trials</h2>
          <div className="flex flex-col gap-6">
            <div className="relative w-full max-w-3xl">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full bg-surface-container-lowest rounded-full py-5 pl-14 pr-12 text-lg text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary-fixed-dim border-none shadow-[0px_4px_16px_rgba(30,41,59,0.02)] transition-shadow outline-none focus:outline-none" placeholder="Search by condition, biomarker, or sponsor..." type="text" />
              <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-secondary">lock</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button className="bg-surface-container-lowest text-on-surface-variant font-medium text-sm px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm">
                Phase <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>
              <button className="bg-surface-container-lowest text-on-surface-variant font-medium text-sm px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm">
                Condition <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>
              <button className="bg-surface-container-lowest text-on-surface-variant font-medium text-sm px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm">
                Compensation <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>
              <button className="bg-surface-container-lowest text-on-surface-variant font-medium text-sm px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm">
                Location <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>
              <button className="ml-auto text-primary font-medium text-sm hover:underline px-4 py-2">Clear All</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
          <article className="bg-surface-container-lowest rounded-lg p-8 flex flex-col gap-6 hover:shadow-[0px_12px_32px_rgba(30,41,59,0.04)] transition-shadow duration-300">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-fit">Phase III</span>
                <h3 className="font-headline text-2xl font-semibold text-on-surface leading-tight">Efficacy of Targeted Immunotherapy in Advanced Melanoma</h3>
              </div>
              <button className="text-outline hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">bookmark_border</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
              <p className="text-on-surface-variant font-body text-base leading-relaxed">
                Evaluating the long-term response rates of novel PD-1 inhibitors combined with selective BRAF targeting in patients with specific genetic markers.
              </p>
              
              <div className="bg-surface p-5 rounded-xl flex flex-col gap-3 mt-2">
                <div className="flex justify-between items-center border-b border-surface-variant pb-3">
                  <span className="text-sm text-on-surface-variant font-medium">Sponsor</span>
                  <span className="text-sm font-semibold text-on-surface">Aura Biosciences</span>
                </div>
                <div className="flex justify-between items-center border-b border-surface-variant pb-3">
                  <span className="text-sm text-on-surface-variant font-medium">Duration</span>
                  <span className="text-sm font-semibold text-on-surface">24 Months</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm text-on-surface-variant font-medium">Compensation</span>
                  <span className="text-sm font-semibold text-primary font-mono bg-primary-fixed/20 px-2 py-0.5 rounded">$4,500 USDC</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 pt-2 gap-4">
              <div className="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold w-fit">
                <span className="material-symbols-outlined text-[14px]">shield_locked</span>
                ZK Protected
              </div>
              <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-3 rounded-full font-semibold text-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto">
                Apply Anonymously <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </article>
          
          <article className="bg-surface-container-lowest rounded-lg p-8 flex flex-col gap-6 hover:shadow-[0px_12px_32px_rgba(30,41,59,0.04)] transition-shadow duration-300">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-fit">Phase II</span>
                <h3 className="font-headline text-2xl font-semibold text-on-surface leading-tight">Neuromodulation for Treatment-Resistant Depression</h3>
              </div>
              <button className="text-outline hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">bookmark_border</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
              <p className="text-on-surface-variant font-body text-base leading-relaxed">
                A double-blind study assessing the efficacy of non-invasive transcranial magnetic stimulation using personalized brain mapping algorithms.
              </p>
              
              <div className="bg-surface p-5 rounded-xl flex flex-col gap-3 mt-2">
                <div className="flex justify-between items-center border-b border-surface-variant pb-3">
                  <span className="text-sm text-on-surface-variant font-medium">Sponsor</span>
                  <span className="text-sm font-semibold text-on-surface">Cerebral Therapeutics</span>
                </div>
                <div className="flex justify-between items-center border-b border-surface-variant pb-3">
                  <span className="text-sm text-on-surface-variant font-medium">Duration</span>
                  <span className="text-sm font-semibold text-on-surface">12 Weeks</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm text-on-surface-variant font-medium">Compensation</span>
                  <span className="text-sm font-semibold text-primary font-mono bg-primary-fixed/20 px-2 py-0.5 rounded">$1,200 USDC</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 pt-2 gap-4">
              <div className="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold w-fit">
                <span className="material-symbols-outlined text-[14px]">shield_locked</span>
                ZK Protected
              </div>
              <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-3 rounded-full font-semibold text-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto">
                Apply Anonymously <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </article>
        </section>

        <div className="flex justify-center mt-8 mb-12">
          <button className="text-primary font-semibold text-sm flex items-center gap-2 px-6 py-3 rounded-full hover:bg-surface-container-low transition-colors">
             Load More Trials <span className="material-symbols-outlined">expand_more</span>
          </button>
        </div>
      </main>
    </div>
  );
}
