export function PatientApply() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 w-full overflow-y-auto h-[100dvh]">
      <div className="max-w-3xl w-full mx-auto">
        {/* Header & Branding */}
        <div className="w-full mb-12 text-center">
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight mb-2">MedVault</h1>
          <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Clinical Sanctuary Protocol</p>
        </div>

        {/* Progress Indicator */}
        <div className="w-full mb-16 px-4 md:px-0">
          <div className="flex items-center justify-between relative">
            {/* Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -z-10 -translate-y-1/2"></div>
            
            {/* Steps */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold shadow-sm">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <span className="text-xs font-label text-on-surface-variant">Identity</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-primary text-primary flex items-center justify-center text-sm font-bold bg-white relative">
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-white"></span>
                2
              </div>
              <span className="text-xs font-label text-primary font-semibold">Data</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="text-xs font-label text-on-surface-variant">Submit</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-sm font-bold">
                4
              </div>
              <span className="text-xs font-label text-on-surface-variant">Processing</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full bg-surface-container-lowest rounded-lg p-8 md:p-12 ambient-shadow mb-8 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-secondary-fixed opacity-20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="mb-10 relative z-10">
            <h2 className="font-headline text-2xl font-semibold text-on-background mb-3">Encrypt Health Data</h2>
            <p className="text-on-surface-variant font-body text-body-lg leading-relaxed">
              Enter your baseline clinical metrics. This data will be cryptographically hashed locally before transmission.
            </p>
          </div>

          {/* Encryption Banner */}
          <div className="bg-secondary-fixed/50 border border-secondary-fixed-dim/30 rounded-[1rem] p-4 mb-10 flex items-start gap-4 relative z-10">
            <div className="bg-secondary text-on-secondary rounded-full p-2 flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <div>
              <h3 className="font-label font-semibold text-on-secondary-container text-sm mb-1">Zero-Knowledge Proof Active</h3>
              <p className="text-on-surface-variant text-sm font-body">Your data is encrypted before leaving your device. Researchers receive verifying proof without exposing underlying values.</p>
            </div>
          </div>

          <form className="space-y-6 relative z-10">
            {/* Grid Layout for Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Age */}
              <div className="flex flex-col gap-2">
                <label className="font-label text-sm font-medium text-on-surface-variant pl-2">Age</label>
                <div className="relative focus-ring rounded-[1rem] bg-surface-container-low transition-colors">
                  <input className="w-full bg-transparent border-none rounded-[1rem] py-3 px-4 text-on-background font-mono placeholder:text-outline/50 focus:ring-0 focus:outline-none" placeholder="Years" type="number" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <label className="font-label text-sm font-medium text-on-surface-variant pl-2">Biological Sex</label>
                <div className="relative focus-ring rounded-[1rem] bg-surface-container-low transition-colors">
                  <select className="w-full bg-transparent border-none rounded-[1rem] py-3 px-4 pr-12 text-on-background font-body appearance-none focus:ring-0 focus:outline-none" defaultValue="">
                    <option disabled value="">Select...</option>
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                    <option value="o">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-10 flex items-center pr-2 pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-secondary border-l border-surface-variant pl-2 h-2/3 my-auto">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="flex flex-col gap-2">
                <label className="font-label text-sm font-medium text-on-surface-variant pl-2">Weight</label>
                <div className="relative focus-ring rounded-[1rem] bg-surface-container-low transition-colors">
                  <input className="w-full bg-transparent border-none rounded-[1rem] py-3 px-4 text-on-background font-mono placeholder:text-outline/50 focus:ring-0 focus:outline-none" placeholder="kg" step="0.1" type="number" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                </div>
              </div>

              {/* Height */}
              <div className="flex flex-col gap-2">
                <label className="font-label text-sm font-medium text-on-surface-variant pl-2">Height</label>
                <div className="relative focus-ring rounded-[1rem] bg-surface-container-low transition-colors">
                  <input className="w-full bg-transparent border-none rounded-[1rem] py-3 px-4 text-on-background font-mono placeholder:text-outline/50 focus:ring-0 focus:outline-none" placeholder="cm" type="number" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                </div>
              </div>

              {/* HbA1c */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label text-sm font-medium text-on-surface-variant pl-2">HbA1c Level (%)</label>
                <div className="relative focus-ring rounded-[1rem] bg-surface-container-low transition-colors">
                  <input className="w-full bg-transparent border-none rounded-[1rem] py-3 px-4 text-on-background font-mono placeholder:text-outline/50 focus:ring-0 focus:outline-none" placeholder="e.g. 5.7" step="0.1" type="number" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                </div>
              </div>

              {/* Diabetes */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label text-sm font-medium text-on-surface-variant pl-2">Diabetes Diagnosis</label>
                <div className="relative focus-ring rounded-[1rem] bg-surface-container-low transition-colors">
                  <select className="w-full bg-transparent border-none rounded-[1rem] py-3 px-4 pr-12 text-on-background font-body appearance-none focus:ring-0 focus:outline-none" defaultValue="">
                    <option disabled value="">Select status...</option>
                    <option value="none">None</option>
                    <option value="type1">Type 1</option>
                    <option value="type2">Type 2</option>
                    <option value="prediabetes">Prediabetes</option>
                  </select>
                  <div className="absolute inset-y-0 right-10 flex items-center pr-2 pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-secondary border-l border-surface-variant pl-2 h-2/3 my-auto">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-6 border-t border-surface-container-high/50">
                
                <div className="flex items-center justify-between p-4 rounded-[1rem] bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">smoking_rooms</span>
                    <span className="font-label text-sm font-medium text-on-background">Smoker Status</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input className="sr-only peer" type="checkbox" />
                      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <div className="text-secondary flex items-center border-l border-surface-variant pl-3">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-[1rem] bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">monitor_heart</span>
                    <span className="font-label text-sm font-medium text-on-background">Hypertension</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input className="sr-only peer" type="checkbox" />
                      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <div className="text-secondary flex items-center border-l border-surface-variant pl-3">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Button */}
            <div className="mt-12 flex justify-end pt-6 border-t border-surface-container-high/30">
              <button 
                type="button"
                className="bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full px-8 py-4 font-headline font-semibold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center gap-3 group"
              >
                Encrypt & Continue
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer Info */}
        <div className="text-center text-xs font-label text-outline uppercase tracking-widest mt-8 pb-12">
          <p>
            <span className="material-symbols-outlined text-[14px] align-middle mr-1">verified_user</span> 
            Protocol ID: <span className="font-mono text-on-surface-variant">MV-TRL-9284-SEC</span>
          </p>
        </div>
      </div>
    </main>
  );
}
