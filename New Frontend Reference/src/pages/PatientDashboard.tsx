import { Link } from "react-router-dom";

export function PatientDashboard() {
  return (
    <main className="flex-1 flex flex-col h-[100dvh] overflow-y-auto w-full relative z-0">
      {/* Top App Bar / Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="font-headline font-bold text-2xl text-on-surface tracking-tight">Patient Overview</h2>
        </div>
        <div className="flex items-center gap-6">
          {/* Privacy Badge */}
          <div className="flex items-center gap-2 bg-secondary-container/20 px-3 py-1.5 rounded-full border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-xs font-semibold text-secondary">Privacy Active</span>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full shadow-[0px_12px_32px_rgba(30,41,59,0.04)]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]">account_balance_wallet</span>
            </div>
            <span className="font-['JetBrains_Mono'] text-xs text-on-surface-variant font-medium">0x7F...3b9A</span>
          </div>

          {/* Trailing Actions */}
          <div className="flex gap-2">
            <button className="p-2 text-teal-700 hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined">lock</span>
            </button>
            <button className="p-2 text-teal-700 hover:bg-surface-container-high rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full"></span>
            </button>
          </div>
          <img
            alt="User clinical profile"
            className="w-10 h-10 rounded-full border-2 border-surface-container-highest object-cover"
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <div className="px-8 py-10 max-w-screen-2xl mx-auto w-full flex-1">
        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-[0px_16px_40px_rgba(30,41,59,0.08)] transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div>
              <p className="font-label text-sm text-on-surface-variant mb-1">Active Applications</p>
              <h3 className="font-headline text-4xl font-bold text-on-surface">2</h3>
            </div>
            <Link to="/patient/applications" className="flex items-center gap-2 text-primary text-sm font-medium w-fit">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
               View Details
            </Link>
          </div>
          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-[0px_16px_40px_rgba(30,41,59,0.08)] transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div>
              <p className="font-label text-sm text-on-surface-variant mb-1">Eligible Trials</p>
              <h3 className="font-headline text-4xl font-bold text-on-surface">12</h3>
            </div>
            <Link to="/patient/find-trials" className="flex items-center gap-2 text-secondary text-sm font-medium w-fit">
              <span className="material-symbols-outlined text-[18px]">search</span>
              Explore Matches
            </Link>
          </div>
          {/* Card 3 */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-[0px_16px_40px_rgba(30,41,59,0.08)] transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div>
              <p className="font-label text-sm text-on-surface-variant mb-1">Pending Results</p>
              <h3 className="font-headline text-4xl font-bold text-on-surface">1</h3>
            </div>
            <Link to="/patient/results" className="flex items-center gap-2 text-tertiary-container text-sm font-medium w-fit">
              <span className="material-symbols-outlined text-[18px]">pending</span>
              Check Status
            </Link>
          </div>
        </section>

        {/* Browse Trials Section */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-headline text-2xl font-semibold text-on-surface mb-2">Browse Trials</h2>
              <p className="text-on-surface-variant text-sm font-body">ZKP-verified clinical opportunities matched to your profile.</p>
            </div>
            <button className="font-label text-primary font-semibold text-sm flex items-center gap-1 hover:text-primary-container transition-colors">
              View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Trial Card 1 */}
            <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-6 relative border border-outline-variant/15">
              <div className="flex justify-between items-start">
                <div className="bg-primary-container/10 p-3 rounded-full">
                  <span className="material-symbols-outlined text-primary text-2xl">bloodtype</span>
                </div>
                <div className="bg-secondary-fixed/50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-secondary/10">
                  <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">ZK Proof</span>
                </div>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface mb-1">Diabetes Management Study</h3>
                <p className="font-label text-xs text-on-surface-variant">Sponsor: Novocure Labs</p>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-lg">
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Phase</p>
                  <p className="font-semibold text-sm text-on-surface font-body">Phase III</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Compensation</p>
                  <p className="font-semibold text-sm text-on-surface font-body">$500</p>
                </div>
              </div>
              <Link to="/patient/applications" className="w-full mt-2 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-semibold text-sm hover:shadow-[0px_8px_24px_rgba(0,104,95,0.2)] transition-shadow text-center flex justify-center">
                Apply Anonymously
              </Link>
            </div>

            {/* Trial Card 2 */}
            <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-6 relative border border-outline-variant/15">
              <div className="flex justify-between items-start">
                <div className="bg-primary-container/10 p-3 rounded-full">
                  <span className="material-symbols-outlined text-primary text-2xl">monitor_heart</span>
                </div>
                <div className="bg-secondary-fixed/50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-secondary/10">
                  <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">ZK Proof</span>
                </div>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface mb-1">Heart Health Phase II</h3>
                <p className="font-label text-xs text-on-surface-variant">Sponsor: CardioGenix</p>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-lg">
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Phase</p>
                  <p className="font-semibold text-sm text-on-surface font-body">Phase II</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Compensation</p>
                  <p className="font-semibold text-sm text-on-surface font-body">$750</p>
                </div>
              </div>
              <Link to="/patient/applications" className="w-full mt-2 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-semibold text-sm hover:shadow-[0px_8px_24px_rgba(0,104,95,0.2)] transition-shadow text-center flex justify-center">
                Apply Anonymously
              </Link>
            </div>

            {/* Trial Card 3 */}
            <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-6 relative border border-outline-variant/15">
              <div className="flex justify-between items-start">
                <div className="bg-primary-container/10 p-3 rounded-full">
                  <span className="material-symbols-outlined text-primary text-2xl">bedtime</span>
                </div>
                <div className="bg-secondary-fixed/50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-secondary/10">
                  <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">ZK Proof</span>
                </div>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface mb-1">Sleep Research</h3>
                <p className="font-label text-xs text-on-surface-variant">Sponsor: Somnia Institute</p>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-lg">
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Phase</p>
                  <p className="font-semibold text-sm text-on-surface font-body">Observational</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Compensation</p>
                  <p className="font-semibold text-sm text-on-surface font-body">$300</p>
                </div>
              </div>
              <Link to="/patient/applications" className="w-full mt-2 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-semibold text-sm hover:shadow-[0px_8px_24px_rgba(0,104,95,0.2)] transition-shadow text-center flex justify-center">
                Apply Anonymously
              </Link>
            </div>
          </div>
        </section>
        {/* Bottom spacing for scroll */}
        <div className="h-24 w-full"></div>
      </div>
    </main>
  );
}
