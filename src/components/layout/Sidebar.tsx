import { Link, useLocation } from "react-router-dom";
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
  ChevronRight,
  Shield,
  Zap,
  Lock,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

const patientNavItems = [
  {
    title: "Dashboard",
    href: "/patient",
    icon: LayoutDashboard,
  },
  {
    title: "Medical Vault",
    href: "/patient/vault",
    icon: ShieldCheck,
  },
  {
    title: "Find Trials",
    href: "/patient/trials",
    icon: Search,
  },
  {
    title: "Consent Logs",
    href: "/patient/consent",
    icon: FileText,
  },
];

const sponsorNavItems = [
  {
    title: "Dashboard",
    href: "/sponsor",
    icon: LayoutDashboard,
  },
  {
    title: "Active Trials",
    href: "/sponsor/trials",
    icon: Activity,
  },
  {
    title: "Patient Matches",
    href: "/sponsor/matches",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/sponsor/analytics",
    icon: Database,
  },
  {
    title: "Audit Logs",
    href: "/sponsor/audit",
    icon: ShieldCheck,
  },
  {
    title: "Profile Settings",
    href: "/sponsor/settings",
    icon: User,
  },
  {
    title: "Sponsor Verification",
    href: "/admin/sponsors",
    icon: ShieldAlert,
  },
];

interface SidebarProps {
  role: "patient" | "sponsor";
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navItems = role === "patient" ? patientNavItems : sponsorNavItems;
  const homeLink = role === "patient" ? "/patient" : "/sponsor";
  const portalName = role === "patient" ? "Patient Interface" : "Sponsor Console";

  return (
    <div className="flex h-full w-[280px] flex-col border-r border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 transition-all duration-300">
      {/* ─── Premium Branding Header ─── */}
      <div className="relative flex h-24 items-center px-8">
        <Link to={homeLink} className="group flex items-center gap-0">
          <div className="relative flex h-14 w-24 items-center justify-center transition-transform duration-300 group-hover:scale-110 -mr-2">
            <img src="/logo.png" alt="MedVault Logo" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
              MedVault
            </span>
          </div>
        </Link>
      </div>

      {/* ─── Portal Indicator ─── */}
      <div className="px-8 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {portalName}
          </span>
        </div>
      </div>

      {/* ─── Main Navigation ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="space-y-6"
        >
          {/* Main Nav Section */}
          <motion.div variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 }
          }}>
            <p className="px-4 mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 opacity-80">
              Main Menu
            </p>
            <div className="space-y-1.5">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || (item.href !== "/patient" && item.href !== "/sponsor" && location.pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-500",
                      isActive
                        ? "text-accent bg-accent/5 dark:bg-accent/10 border border-accent/10"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 w-1.5 h-6 bg-accent rounded-r-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={cn(
                      "h-5 w-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                      isActive ? "text-accent" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )} />
                    <span className="flex-1 tracking-tight">{item.title}</span>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-accent/10 p-1 rounded-lg"
                      >
                        <ChevronRight className="h-3.5 w-3.5 opacity-50 text-accent" />
                      </motion.div>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* User Specific Section */}
          {role === "patient" && (
            <motion.div variants={{
              hidden: { opacity: 0, x: -10 },
              visible: { opacity: 1, x: 0 }
            }}>
              <p className="px-4 mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 opacity-80">
                Patient Area
              </p>
              <div className="space-y-1.5">
                <Link
                  to="/patient/applied"
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-500",
                    location.pathname === "/patient/applied"
                      ? "text-accent bg-accent/5 dark:bg-accent/10 border border-accent/10"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  )}
                >
                  {location.pathname === "/patient/applied" && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 w-1.5 h-6 bg-accent rounded-r-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <FlaskConical className={cn(
                    "h-5 w-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                    location.pathname === "/patient/applied" ? "text-accent" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )} />
                  <span className="flex-1 tracking-tight">My Applications</span>
                  {location.pathname === "/patient/applied" && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-accent/10 p-1 rounded-lg"
                    >
                      <ChevronRight className="h-3.5 w-3.5 opacity-50 text-accent" />
                    </motion.div>
                  )}
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ─── Security Widget & Logout ─── */}
      <div className="px-6 py-6 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
        <div className="space-y-6">
          <div className="relative group overflow-hidden rounded-3xl bg-slate-900 dark:bg-[#0a0f1d] p-5 border border-white/5 shadow-2xl transition-all duration-500 hover:border-accent/30">
            <div className="absolute top-0 right-0 -mr-3 -mt-3 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Lock className="h-16 w-16 text-white -rotate-12" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/20 text-accent shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">V3.2 Active</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-[13px] font-bold text-white tracking-tight">Full FHE Protection</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed opacity-80">Encryption is active across all computations.</p>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="h-full bg-accent shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                />
              </div>
            </div>
          </div>

          <Link to="/" className="group flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-300">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors">
              <LogOut className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-1 hover:scale-110" />
            </div>
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
