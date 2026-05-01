export function SponsorDashboard() {
  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-y-auto relative z-0 bg-background text-on-background">
      {/* Top Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 border-b border-surface-variant/30">
        <div className="flex items-center gap-12">
          <span className="text-2xl font-bold text-teal-800 tracking-tight">MedVault</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-teal-700">
            <button className="hover:text-teal-600 transition-colors"><span className="material-symbols-outlined">lock</span></button>
            <button className="hover:text-teal-600 transition-colors"><span className="material-symbols-outlined">notifications</span></button>
          </div>
          <img alt="User clinical profile" className="w-10 h-10 rounded-full object-cover border border-outline-variant/30" src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop" referrerPolicy="no-referrer" />
        </div>
      </nav>

      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto flex-col lg:flex-row">
        {/* Main Content Area */}
        <main className="flex-1 px-8 py-12 flex flex-col gap-12">
           <section className="flex flex-col gap-8">
             <div className="flex justify-between items-end">
               <div>
                 <h1 className="font-headline text-3xl font-semibold text-on-surface tracking-tight">Sponsor Dashboard</h1>
                 <p className="font-body text-lg text-on-surface-variant mt-2">Manage clinical protocols and funding securely.</p>
               </div>
               <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-label font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0px_12px_32px_rgba(30,41,59,0.04)]">
                 <span className="material-symbols-outlined text-lg">add</span>
                 Create Trial
               </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric 1 */}
                <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-2">
                   <div className="flex justify-between items-start">
                     <span className="font-label text-sm text-on-surface-variant uppercase tracking-wider">Total Trials</span>
                     <span className="material-symbols-outlined text-primary">experiment</span>
                   </div>
                   <span className="font-headline text-4xl font-semibold text-on-surface mt-2">4</span>
                </div>
                {/* Metric 2 */}
                <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-2">
                   <div className="flex justify-between items-start">
                     <span className="font-label text-sm text-on-surface-variant uppercase tracking-wider">Total Applicants</span>
                     <span className="material-symbols-outlined text-primary">group</span>
                   </div>
                   <span className="font-headline text-4xl font-semibold text-on-surface mt-2">142</span>
                </div>
                {/* Metric 3 */}
                <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col gap-2 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                   <div className="flex justify-between items-start relative z-10">
                     <span className="font-label text-sm text-on-surface-variant uppercase tracking-wider">Active Protocols</span>
                     <span className="material-symbols-outlined text-primary">vital_signs</span>
                   </div>
                   <span className="font-headline text-4xl font-semibold text-primary mt-2 relative z-10">3</span>
                </div>
             </div>
           </section>

           {/* Table */}
           <section className="bg-surface-container-lowest rounded-lg shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col">
              <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
                 <h2 className="font-headline text-xl font-semibold text-on-surface">Active & Draft Protocols</h2>
                 <button className="text-primary font-label text-sm font-semibold flex items-center gap-1 hover:text-primary-container transition-colors">
                    <span className="material-symbols-outlined text-sm">filter_list</span> Filter
                 </button>
              </div>
              <div className="overflow-x-auto border-x-0 border-b-0 border-t border-transparent">
                 <table className="w-full text-left font-body">
                    <thead className="bg-surface-container-low/50">
                       <tr>
                          <th className="px-8 py-4 font-label text-xs uppercase tracking-wider text-on-surface-variant font-medium">Trial Name</th>
                          <th className="px-8 py-4 font-label text-xs uppercase tracking-wider text-on-surface-variant font-medium">Phase</th>
                          <th className="px-8 py-4 font-label text-xs uppercase tracking-wider text-on-surface-variant font-medium">Applicants</th>
                          <th className="px-8 py-4 font-label text-xs uppercase tracking-wider text-on-surface-variant font-medium">Status</th>
                          <th className="px-8 py-4 font-label text-xs uppercase tracking-wider text-on-surface-variant font-medium">Pool Funded</th>
                          <th className="px-8 py-4 font-label text-xs uppercase tracking-wider text-on-surface-variant font-medium text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                       <tr className="hover:bg-surface-container-low/30 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="font-semibold text-on-surface">Project Aegis</span>
                                <span className="font-mono text-xs text-on-surface-variant mt-1">ID: #AEG-092</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-on-surface-variant">Phase II</td>
                          <td className="px-8 py-5 text-sm text-on-surface-variant">45</td>
                          <td className="px-8 py-5">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary-fixed text-on-secondary-fixed">
                               <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Active
                             </span>
                          </td>
                          <td className="px-8 py-5 font-mono text-sm text-on-surface">12.5 ETH</td>
                          <td className="px-8 py-5 text-right">
                             <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                          </td>
                       </tr>
                       {/* NeoVax Trial */}
                       <tr className="hover:bg-surface-container-low/30 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="font-semibold text-on-surface">NeoVax Trial</span>
                                <span className="font-mono text-xs text-on-surface-variant mt-1">ID: #NVX-114</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-on-surface-variant">Phase I</td>
                          <td className="px-8 py-5 text-sm text-on-surface-variant">12</td>
                          <td className="px-8 py-5">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant">
                               <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Draft
                             </span>
                          </td>
                          <td className="px-8 py-5 font-mono text-sm text-on-surface">0.0 ETH</td>
                          <td className="px-8 py-5 text-right">
                             <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                          </td>
                       </tr>
                       {/* CardioGen Trial */}
                       <tr className="hover:bg-surface-container-low/30 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="font-semibold text-on-surface">CardioGen</span>
                                <span className="font-mono text-xs text-on-surface-variant mt-1">ID: #CDG-003</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-on-surface-variant">Phase III</td>
                          <td className="px-8 py-5 text-sm text-on-surface-variant">85</td>
                          <td className="px-8 py-5">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary-fixed text-on-secondary-fixed">
                               <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Active
                             </span>
                          </td>
                          <td className="px-8 py-5 font-mono text-sm text-on-surface">45.0 ETH</td>
                          <td className="px-8 py-5 text-right">
                             <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                          </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </section>
        </main>

        {/* Right Panel */}
        <aside className="w-full lg:w-96 bg-surface-container-low min-h-full p-8 flex flex-col gap-8 lg:border-l border-outline-variant/15">
           <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">Fund Trial Pool</h3>
              <p className="font-body text-sm text-on-surface-variant mt-1">Securely lock funds in smart contract for milestone payouts.</p>
           </div>
           
           <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)]">
              <label className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2 block">Select Protocol</label>
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 mb-6 cursor-pointer">
                 <span className="font-body text-on-surface font-medium">Project Aegis (#AEG-092)</span>
                 <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
              </div>
              
              <label className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2 block">Amount (ETH)</label>
              <div className="relative flex items-center bg-surface-container-lowest rounded-DEFAULT border-2 border-transparent focus-within:border-primary-fixed-dim focus-within:shadow-[0_0_0_2px_rgba(107,216,203,0.2)] transition-all">
                 <input className="w-full bg-transparent border-none text-xl font-mono text-on-surface focus:ring-0 py-3 pl-4 focus:outline-none" placeholder="0.00" type="number" />
                 <div className="pr-4 flex items-center text-secondary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                 </div>
              </div>
              
              <div className="mt-8">
                 <h4 className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4">Milestone Breakdown</h4>
                 <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                       <span className="font-body text-sm text-on-surface">Phase I Completion</span>
                       <span className="font-mono text-sm text-on-surface-variant">25%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                       <div className="bg-primary h-1.5 rounded-full w-1/4"></div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                       <span className="font-body text-sm text-on-surface">Phase II Data Lock</span>
                       <span className="font-mono text-sm text-on-surface-variant">50%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                       <div className="bg-primary h-1.5 rounded-full w-2/4"></div>
                    </div>
                 </div>
              </div>
              
              <button className="w-full mt-8 bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-label font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
                 <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                 Lock Funds
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
}
