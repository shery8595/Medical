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
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useWeb3 } from "../../lib/Web3Context";

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
  { title: "Sponsor Verification", href: "/sponsor/profile-settings", icon: ClipboardCheck },
];

const patientSecondaryNavItems = [
  { title: "My Applications", href: "/patient/applications", icon: FlaskConical },
  { title: "Results", href: "/patient/results", icon: ClipboardCheck },
  { title: "Identity & Privacy", href: "/patient/identity", icon: Fingerprint },
  { title: "Settings", href: "/patient/dashboard", icon: Settings },
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
          "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all",
          isPatient ? patientClasses : sponsorClasses
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </Link>
    );
  };

  return (
    <div className={cn("flex h-full w-[280px] flex-col", isPatient ? "bg-white" : "bg-slate-50")}>
      <div className={cn("px-6 pt-7 pb-5", isPatient ? "border-b border-slate-100" : "border-b border-slate-200")}>
        <Link to={homeLink} className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center font-bold",
              isPatient ? "bg-teal-600 text-white" : "bg-[#1D2634] text-white"
            )}
          >
            M
          </div>
          <div>
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

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-7">
        <div className="space-y-1.5">
          {navItems.map((item) => (
            <NavItem key={item.href} title={item.title} href={item.href} icon={item.icon} />
          ))}
        </div>

        {role === "patient" && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Patient Area</p>
            {patientSecondaryNavItems.map((item) => (
              <NavItem key={item.href} title={item.title} href={item.href} icon={item.icon} />
            ))}
          </div>
        )}
      </div>

      <div className={cn("px-4 py-5", isPatient ? "border-t border-slate-100" : "border-t border-slate-200")}>
        <button
          type="button"
          onClick={() => {
            void (async () => {
              await logout();
              navigate("/");
            })();
          }}
          className={cn(
            "w-full text-left flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all",
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
