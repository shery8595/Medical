export function SponsorVerification() {
  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-y-auto relative z-0 bg-background text-on-background">
      <header className="bg-[#f7f9fb]/80 backdrop-blur-xl font-headline tracking-tight docked full-width top-0 sticky z-40 border-b border-surface-variant/30 flex justify-between items-center px-8 py-4 w-full">
        <div className="md:hidden">
          <span className="text-xl font-bold text-teal-700">Clinical Sanctuary</span>
        </div>
        <div className="hidden md:block"></div>
        <div className="flex items-center space-x-6">
          <button className="text-slate-500 hover:text-teal-600 transition-colors scale-95 duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-500 hover:text-teal-600 transition-colors scale-95 duration-200">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </button>
          <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full font-medium text-sm hover:shadow-lg transition-all">
            Connect Wallet
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <div>
            <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Sponsor Verification</h2>
            <p className="text-on-surface-variant font-body text-lg">Cryptographic proof of institutional identity and clinical authorization.</p>
          </div>

          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-fixed-dim/20 to-transparent rounded-bl-full -z-10"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center space-x-2 bg-primary-container/10 text-primary-container px-4 py-2 rounded-full mb-6">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="font-bold text-sm tracking-wide">VERIFIED SPONSOR</span>
                </div>
                <h3 className="text-3xl font-headline font-bold text-on-surface mb-1">Novartis Institute for Biomedical Research</h3>
                <p className="font-mono text-sm text-outline flex items-center space-x-2 mt-2">
                  <span className="material-symbols-outlined text-sm">fingerprint</span>
                  <span>DID:ethr:0x8f9c...3b2a</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-label text-on-surface-variant mb-1">Approval Date</p>
                <p className="text-xl font-body font-medium text-on-surface">Oct 12, 2023</p>
                <p className="text-sm font-label text-on-surface-variant mt-4 mb-1">Expiration Date</p>
                <p className="text-lg font-body font-medium text-on-surface">Oct 12, 2025</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-headline font-bold text-on-surface mb-8 border-b border-surface-container-high pb-4">Authorized Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest rounded-[1.25rem] p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-surface-container-high hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary-container/10 text-primary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">add_circle</span>
                </div>
                <h4 className="text-lg font-headline font-bold text-on-surface mb-2">Create Trials</h4>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                  Authorized to deploy new clinical trial protocols to the blockchain and establish participant criteria.
                </p>
              </div>

              <div className="bg-surface-container-lowest rounded-[1.25rem] p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-surface-container-high hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary-container/10 text-primary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <h4 className="text-lg font-headline font-bold text-on-surface mb-2">Fund Pools</h4>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                  Verified to manage treasury operations, fund trial bounties, and process participant compensation smart contracts.
                </p>
              </div>

              <div className="bg-surface-container-lowest rounded-[1.25rem] p-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] border border-surface-container-high hover:border-primary/20 transition-colors relative overflow-hidden">
                <div className="absolute top-4 right-4 text-secondary">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">person_search</span>
                </div>
                <h4 className="text-lg font-headline font-bold text-on-surface mb-2">View Matches</h4>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                  ZK-Proof authorized to view anonymized participant match data without exposing underlying PHI.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-[1.5rem] p-8 mt-12">
            <h3 className="text-lg font-headline font-bold text-on-surface mb-6 flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary">gavel</span>
              <span>Verification Ledger</span>
            </h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Issuer Authority</span>
                <span className="text-on-surface font-medium">FDA Gateway Identity Node</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Credential Type</span>
                <span className="text-on-surface font-medium">VerifiableSponsorCredential_v2</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant">Tx Hash</span>
                <span className="text-primary hover:underline cursor-pointer">0x7a2...99f4</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
