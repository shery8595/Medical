export function PatientMedicalVault() {
  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-y-auto relative z-0 bg-background text-on-background">
      <header className="bg-[#f7f9fb]/80 backdrop-blur-xl docked full-width top-0 sticky z-40 border-b border-surface-variant/30 flex justify-between items-center px-8 py-4 w-full">
        <div className="flex items-center gap-4">
          <h2 className="font-headline tracking-tight text-xl font-bold text-teal-700">Data Vault</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-fixed-dim focus:outline-none placeholder-slate-400 shadow-sm text-on-surface" placeholder="Search records..." type="text"/>
          </div>
          <div className="flex items-center gap-3 text-teal-600">
            <button className="p-2 rounded-full hover:bg-surface-container transition-colors scale-95 duration-200 ease-in-out hover:text-teal-600">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 rounded-full hover:bg-surface-container transition-colors scale-95 duration-200 ease-in-out hover:text-teal-600">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </button>
          </div>
          <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold rounded-full px-6 py-2.5 text-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5">
            Update Profile
          </button>
        </div>
      </header>
      
      <main className="flex-1 px-12 py-10 max-w-7xl mx-auto w-full">
        <div className="bg-primary-fixed/20 rounded-lg p-6 mb-12 flex items-center justify-between border border-primary-fixed-dim/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary-fixed rounded-full p-3 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>encrypted</span>
            </div>
            <div>
              <h3 className="font-headline font-semibold text-on-primary-fixed-variant text-lg">Zero-Knowledge Environment</h3>
              <p className="text-on-surface-variant text-sm mt-1">Your data is fully encrypted with Fhenix FHE. Only you can decrypt it.</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-headline text-3xl font-bold text-on-surface">Clinical Profile</h2>
          <p className="text-on-surface-variant mt-2 text-lg">End-to-end encrypted medical baseline data.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {["Age", "Gender", "Weight", "Height", "HbA1c Level", "Diabetes", "Smoker", "Hypertension"].map((trait) => (
            <div key={trait} className="bg-surface-container-lowest rounded-[1rem] p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] flex flex-col justify-between h-44 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="font-label text-base font-medium text-on-surface-variant">{trait}</span>
                <span className="material-symbols-outlined text-teal-600/50" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 font-mono text-sm font-medium tracking-tight">
                  Encrypted
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="h-24"></div>
      </main>
    </div>
  );
}
