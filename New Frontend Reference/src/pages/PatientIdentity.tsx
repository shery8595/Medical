export function PatientIdentity() {
  return (
    <main className="flex-1 overflow-y-auto p-8 md:p-16 lg:px-24 xl:px-32 relative h-[100dvh]">
      {/* Top App Bar (Mobile) - Simulated since SideNav is hidden on mobile */}
      <div className="md:hidden flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-sm">shield</span>
          </div>
          <h1 className="font-headline font-bold text-on-surface text-xl">Identity</h1>
        </div>
        <button className="text-on-surface-variant p-2">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <header className="mb-16 hidden md:block">
        <h1 className="text-4xl font-headline font-semibold text-on-surface mb-2">Identity & Privacy Controls</h1>
        <p className="text-on-surface-variant font-body text-lg">Manage your zero-knowledge proofs and secure data enclaves.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-24">
        {/* Ephemeral Wallet Card */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-secondary-container"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-secondary-fixed rounded-full text-on-secondary-fixed">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <h2 className="font-headline font-semibold text-xl text-on-surface">Ephemeral Wallet</h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 font-body leading-relaxed">
              Your temporary address for current trial interactions. Rotates automatically per session.
            </p>
            <div className="bg-surface-container-low rounded-[1rem] p-4 flex items-center justify-between">
              <span className="font-mono text-on-surface font-semibold tracking-wider text-sm truncate mr-4">0x71C...4f9</span>
              <button className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container flex-shrink-0">
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>

          {/* Identity Backup Card */}
          <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0px_12px_32px_rgba(30,41,59,0.04)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-surface-container-high rounded-full text-on-surface-variant">
                <span className="material-symbols-outlined">save</span>
              </div>
              <h2 className="font-headline font-semibold text-xl text-on-surface">Identity Backup</h2>
            </div>
            <button className="w-full py-4 px-6 rounded-full bg-secondary-container text-on-secondary-container font-semibold hover:bg-secondary hover:text-on-secondary transition-all mb-6 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">download</span>
              Download Identity Backup
            </button>
            <div className="bg-error-container rounded-[1rem] p-5 flex items-start gap-4">
              <span className="material-symbols-outlined text-error mt-0.5">warning</span>
              <div>
                <h4 className="font-headline font-semibold text-error mb-1 text-sm">Critical Warning</h4>
                <p className="text-xs text-on-error-container font-body leading-relaxed">
                  Store this backup in a secure offline location. Losing this file means permanent loss of access to your trial data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Layer Diagram */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-headline font-semibold text-2xl text-on-surface mb-8">Clinical Privacy Layers</h3>
          
          <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] hover:bg-surface-container-low transition-colors border border-outline-variant/15">
            <div className="p-4 bg-primary-fixed rounded-full text-on-primary-fixed shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
            </div>
            <div>
              <h4 className="font-headline font-semibold text-lg text-on-surface mb-2">Semaphore Identity</h4>
              <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                Proves you are a verified participant belonging to the trial group without revealing which specific member you are.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] hover:bg-surface-container-low transition-colors border border-outline-variant/15">
            <div className="p-4 bg-secondary-fixed-dim rounded-full text-on-secondary-fixed-variant shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>enhanced_encryption</span>
            </div>
            <div>
              <h4 className="font-headline font-semibold text-lg text-on-surface mb-2">Fhenix FHE Data</h4>
              <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                Fully Homomorphic Encryption allows researchers to compute statistics on your clinical data while it remains encrypted.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-[0px_12px_32px_rgba(30,41,59,0.04)] hover:bg-surface-container-low transition-colors border border-outline-variant/15">
            <div className="p-4 bg-tertiary-fixed rounded-full text-on-tertiary-fixed shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>swap_calls</span>
            </div>
            <div>
              <h4 className="font-headline font-semibold text-lg text-on-surface mb-2">Relayer Transactions</h4>
              <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                Interactions with the trial smart contracts are routed through untraceable relayers, obscuring your IP and origin.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
