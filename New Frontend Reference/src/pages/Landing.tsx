import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-white/80 backdrop-blur-xl font-['Plus_Jakarta_Sans'] font-semibold w-full top-0 sticky z-50 bg-slate-50/50 tonal-shift">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
            <span className="text-2xl font-bold text-teal-800 tracking-tight">MedVault</span>
          </div>
          {/* Navigation Links (Web) */}
          <div className="hidden md:flex gap-8 items-center">
            <a className="text-slate-600 hover:text-teal-600 transition-colors" href="#">Trials</a>
            <a className="text-slate-600 hover:text-teal-600 transition-colors" href="#">Sponsors</a>
            <a className="text-slate-600 hover:text-teal-600 transition-colors" href="#">About</a>
            <a className="text-slate-600 hover:text-teal-600 transition-colors" href="#">Security</a>
          </div>
          {/* Actions */}
          <div className="hidden md:flex gap-4 items-center">
            <Link to="/patient" className="px-6 py-2 rounded-full border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-colors">
              For Patients
            </Link>
            <Link to="/sponsor" className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold shadow-sm hover:opacity-90 transition-opacity">
              For Sponsors
            </Link>
          </div>
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-on-surface">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </nav>

      <main className="flex-grow flex flex-col pt-8">
        {/* Hero Section */}
        <section className="relative pt-24 pb-40 px-8 max-w-screen-2xl mx-auto w-full flex flex-col items-center text-center overflow-hidden">
          <div
            className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none"
            style={{ background: "radial-gradient(circle at top right, var(--color-primary-fixed-dim), transparent 40%)" }}
          />
          <div className="z-10 max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container/20 text-on-secondary-container font-medium text-sm mb-4">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              ZK-Shield Technology Active
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-on-surface leading-tight">
              Your Health Data.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Your Privacy.</span>
            </h1>
            <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Anonymous clinical trial matching powered by zero-knowledge proofs. Advance medical research without ever revealing your true identity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/patient" className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-semibold text-lg hover:shadow-[0px_12px_32px_rgba(30,41,59,0.1)] transition-all">
                Explore Open Trials
              </Link>
              <button className="px-8 py-4 rounded-full bg-surface-container-low text-on-surface font-headline font-semibold text-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">fingerprint</span>
                How ZK-Proofs Work
              </button>
            </div>
          </div>
          
          {/* Abstract Graphic representing data/privacy */}
          <div className="mt-24 w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0px_24px_64px_rgba(30,41,59,0.08)] border border-white/20 relative h-96 bg-surface-container-lowest flex items-center justify-center">
            <img
              alt="Abstract clinical data visualization"
              className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-luminosity"
              src="https://images.unsplash.com/photo-1576091160550-2173d404c112?q=80&w=2070&auto=format&fit=crop"
              referrerPolicy="no-referrer"
            />
            {/* Overlay content to make it look like an interface */}
            <div className="relative z-10 w-full px-12 flex justify-between items-center opacity-80">
              <div className="space-y-4">
                <div className="h-3 w-48 bg-surface-container-highest rounded-full"></div>
                <div className="h-3 w-32 bg-surface-container-highest rounded-full"></div>
                <div className="h-3 w-64 bg-surface-container-highest rounded-full"></div>
              </div>
              <div className="w-48 h-48 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
                <span className="material-symbols-outlined text-5xl text-primary">lock_clock</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="py-12 bg-gradient-to-b from-surface to-surface-container-low">
          <div className="max-w-screen-xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-surface-variant">
            <div className="pt-8 md:pt-0">
              <div className="font-headline text-4xl font-bold text-primary mb-2">14</div>
              <div className="text-on-surface-variant font-medium text-sm tracking-wide uppercase">Active Trials</div>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="font-headline text-4xl font-bold text-secondary mb-2">100%</div>
              <div className="text-on-surface-variant font-medium text-sm tracking-wide uppercase">Data Encrypted</div>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="font-headline text-4xl font-bold text-primary mb-2">0</div>
              <div className="text-on-surface-variant font-medium text-sm tracking-wide uppercase">Wallet Linkage</div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-32 px-8 max-w-screen-2xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-4">The Clinical Sanctuary Architecture</h2>
            <p className="font-body text-on-surface-variant max-w-2xl mx-auto text-lg">Designed for absolute composure, precision, and uncompromised privacy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-surface-container-lowest rounded-lg p-10 flex flex-col justify-between h-full border border-outline-variant/15 hover:shadow-[0px_12px_32px_rgba(30,41,59,0.04)] transition-all">
              <div>
                <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-secondary text-3xl">fingerprint</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface mb-4">Zero-Knowledge Identity</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">
                  Verify your eligibility for complex trials without exposing your personally identifiable information. Your identity remains cryptographically shielded.
                </p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="bg-surface-container-lowest rounded-lg p-10 flex flex-col justify-between h-full border border-outline-variant/15 hover:shadow-[0px_12px_32px_rgba(30,41,59,0.04)] transition-all relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>
              <div>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">enhanced_encryption</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface mb-4">Encrypted Health Data</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">
                  Your medical records are fragmented and encrypted at rest. Only authorized researchers hold the temporary decryption keys during an active trial phase.
                </p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="bg-surface-container-lowest rounded-lg p-10 flex flex-col justify-between h-full border border-outline-variant/15 hover:shadow-[0px_12px_32px_rgba(30,41,59,0.04)] transition-all">
              <div>
                <div className="w-16 h-16 rounded-full bg-tertiary-container/20 flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-tertiary text-3xl">group_off</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface mb-4">Anonymous Applications</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">
                  Apply to multiple sponsors simultaneously. Your demographic and geographic markers are generalized to prevent reverse-engineering of your identity.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white font-['Inter'] text-xs uppercase tracking-widest w-full py-12 border-t-0 max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center text-slate-400">
        <div className="flex items-center gap-2 mb-8 md:mb-0">
          <span className="font-bold text-slate-900 normal-case text-base">MedVault</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 mb-8 md:mb-0">
          <a className="hover:text-teal-500 underline transition-opacity duration-300" href="#">Privacy Policy</a>
          <a className="hover:text-teal-500 underline transition-opacity duration-300" href="#">HIPAA Compliance</a>
          <a className="hover:text-teal-500 underline transition-opacity duration-300" href="#">Terms of Service</a>
          <a className="hover:text-teal-500 underline transition-opacity duration-300" href="#">Security Whitepaper</a>
        </div>
        <div className="text-center md:text-right">
          © 2024 MedVault. Clinical Sanctuary Protocol.
        </div>
      </footer>
    </div>
  );
}
