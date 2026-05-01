import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const NAV_ITEMS_1 = [
  { name: "Dashboard", path: "/patient/dashboard", icon: "dashboard" },
  { name: "Medical Vault", path: "/patient/medical-vault", icon: "clinical_notes" },
  { name: "Find Trials", path: "/patient/find-trials", icon: "search" },
  { name: "Consent Logs", path: "/patient/consent-logs", icon: "history_edu" },
];

const NAV_ITEMS_2 = [
  { name: "My Applications", path: "/patient/applications", icon: "edit_document" },
  { name: "Results", path: "/patient/results", icon: "assignment_turned_in" },
  { name: "Identity & Privacy", path: "/patient/identity", icon: "fingerprint" },
  { name: "Settings", path: "/patient/settings", icon: "settings" },
];

function NavLink({ item }: { item: any; key?: string }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);
  return (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full font-['Inter'] text-sm tracking-wide transition-all group",
        isActive
          ? "bg-teal-50 text-teal-800 font-semibold"
          : "text-slate-500 hover:bg-slate-100 hover:translate-x-1"
      )}
    >
      <span
        className={cn(
          "material-symbols-outlined transition-colors",
          isActive ? "" : "group-hover:text-teal-600"
        )}
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {item.icon}
      </span>
      <span>{item.name}</span>
    </Link>
  );
}

export function SidebarPatient() {
  return (
    <aside className="hidden md:flex flex-col h-screen w-72 border-r-0 bg-slate-50 p-6 space-y-8 shrink-0 relative z-10 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
        </div>
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-teal-800 text-xl tracking-tight leading-tight">MedVault</h1>
          <div className="bg-primary/10 inline-flex items-center px-1.5 py-0.5 rounded-full mt-1">
            <span className="font-['Inter'] text-[10px] text-primary font-bold uppercase tracking-widest">
              Patient
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <nav className="space-y-1">
          {NAV_ITEMS_1.map((item) => (
             <NavLink key={item.path} item={item} />
          ))}
        </nav>

        <div>
            <h3 className="px-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Patient Area</h3>
            <nav className="space-y-1">
              {NAV_ITEMS_2.map((item) => (
                 <NavLink key={item.path} item={item} />
              ))}
            </nav>
        </div>
      </div>

      {/* CTA & Footer Nav */}
      <div className="mt-auto space-y-6 pt-4 border-t border-surface-variant/50">
        <Link to="/patient/applications" className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-['Inter'] font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Apply Anonymously
        </Link>
        <div className="space-y-1">
          <button className="flex w-full items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full font-['Inter'] text-sm transition-all group hover:translate-x-1">
            <span className="material-symbols-outlined text-[18px] group-hover:text-slate-700">help</span>
            <span>Support</span>
          </button>
          <Link to="/" className="flex w-full items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full font-['Inter'] text-sm transition-all group hover:translate-x-1">
            <span className="material-symbols-outlined text-[18px] group-hover:text-slate-700">logout</span>
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
