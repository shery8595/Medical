import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ElementType } from "react";
import {
  LayoutDashboard,
  FileText,
  Search,
  LogOut,
  Activity,
  ShieldCheck,
  Users,
  User,
  Database,
  FlaskConical,
  Fingerprint,
  Settings,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useWeb3 } from "../../lib/Web3Context";
import brandLogoUrl from "../../../logo/logo.png";

const patientNavItems = [
  { title: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { title: "Medical Vault", href: "/patient/medical-vault", icon: ShieldCheck },
  { title: "Find Trials", href: "/patient/find-trials", icon: Search },
  { title: "Consent Logs", href: "/patient/consent-logs", icon: FileText },
];

const sponsorNavItems = [
  { title: "Dashboard", href: "/sponsor/dashboard", icon: LayoutDashboard },
  { title: "Active Trials", href: "/sponsor/active-trials", icon: Activity },
  { title: "Patient Matches", href: "/sponsor/patient-matches", icon: Users },
  { title: "Analytics", href: "/sponsor/analytics", icon: Database },
  { title: "Audit Logs", href: "/sponsor/audit-logs", icon: ShieldCheck },
  { title: "Profile Settings", href: "/sponsor/profile-settings", icon: User },
  { title: "Verification", href: "/sponsor/verification", icon: ClipboardCheck },
];

const patientSecondaryNavItems = [
  { title: "My Applications", href: "/patient/applications", icon: FlaskConical },
  { title: "Results", href: "/patient/results", icon: ClipboardCheck },
  { title: "Privacy demo (60s)", href: "/patient/privacy-tour", icon: Sparkles },
  { title: "Identity & Privacy", href: "/patient/identity", icon: Fingerprint },
  { title: "Settings", href: "/patient/settings", icon: Settings },
];

interface SidebarProps {
  role: "patient" | "sponsor";
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useWeb3();
  const navItems = role === "patient" ? patientNavItems : sponsorNavItems;
  const homeLink = role === "patient" ? "/patient/dashboard" : "/sponsor/dashboard";
  const portalName = role === "patient" ? "Patient" : "Sponsor";
  const isPatient = role === "patient";

  const isItemActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const NavItem = ({
    title,
    href,
    icon: Icon,
  }: {
    title: string;
    href: string;
    icon: ElementType;
  }) => {
    const isActive = isItemActive(href);
    const patientClasses = isActive
      ? "bg-teal-50 text-teal-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800";
    const sponsorClasses = isActive
      ? "bg-[#1D2634] text-white shadow-sm ring-1 ring-[#1D2634]"
      : "text-slate-600 hover:bg-[#1D2634]/10 hover:text-[#1D2634]";

    return (
      <Link
        to={href}
        className={cn(
          "group flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-all",
          isPatient ? patientClasses : sponsorClasses
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden",
        isPatient ? "bg-white" : "bg-slate-50"
      )}
    >
      <div className={cn("shrink-0 px-5 pt-6 pb-4", isPatient ? "border-b border-slate-100" : "border-b border-slate-200")}>
        <Link to={homeLink} className="flex items-center gap-3 min-w-0">
          <img
            src={brandLogoUrl}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl object-contain"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 leading-none">MedVault</p>
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider mt-1",
                isPatient ? "text-teal-700/80" : "text-[#1D2634]"
              )}
            >
              {portalName} Console
            </p>
          </div>
        </Link>
      </div>

      <nav className="shrink-0 px-3 pt-4 pb-3 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItem key={item.href} title={item.title} href={item.href} icon={item.icon} />
        ))}
      </nav>

      {role === "patient" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-100">
          <p className="shrink-0 px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Patient area
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 space-y-1.5 scrollbar-hide">
            {patientSecondaryNavItems.map((item) => (
              <NavItem key={item.href} title={item.title} href={item.href} icon={item.icon} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0" aria-hidden />
      )}

      <div className={cn("shrink-0 px-3 py-4", isPatient ? "border-t border-slate-100" : "border-t border-slate-200")}>
        <button
          type="button"
          onClick={() => {
            void (async () => {
              await logout();
              navigate("/");
            })();
          }}
          className={cn(
            "w-full text-left flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-all",
            isPatient
              ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          )}
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
