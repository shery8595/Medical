import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

const ASSET_BASE = "/landing%20page";

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const footerVariants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans selection:bg-[#89f5e7]/40">
      <nav className="sticky top-0 z-50 w-full border-b border-[#bcc9c6]/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-4 md:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-[#00685f]">
            <img src={`${ASSET_BASE}/logo-mark.svg`} alt="" className="h-7 w-7" aria-hidden />
            <span>MedVault</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-[#3d4947] transition-colors hover:text-[#00685f]">
              How it Works
            </a>
            <a href="#privacy" className="text-[#3d4947] transition-colors hover:text-[#00685f]">
              Privacy
            </a>
            <Link to="/sponsor/dashboard" className="text-[#3d4947] transition-colors hover:text-[#00685f]">
              For Doctors
            </Link>
            <Link to="/patient/dashboard" className="text-[#3d4947] transition-colors hover:text-[#00685f]">
              For Patients
            </Link>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/patient/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[#00685f]/70 px-5 py-2 text-sm font-semibold text-[#00685f] transition hover:bg-[#00685f]/5"
            >
              <img src={`${ASSET_BASE}/icon-wallet.svg`} alt="" className="h-4 w-4" aria-hidden />
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>

      <motion.footer
        className="border-t border-[#bcc9c6]/60 bg-white py-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={footerVariants}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 lg:flex-row lg:px-10">
          <p className="text-sm text-[#5a6a80]">
            <span className="font-semibold text-[#00685f]">MedVault</span> — encrypted clinical trial matching.
          </p>
          <div className="flex items-center gap-6 text-sm text-[#5a6a80]">
            <Link to="/technology" className="hover:text-[#00685f]">Technology</Link>
            <Link to="/security" className="hover:text-[#00685f]">Security</Link>
            <Link to="/docs" className="hover:text-[#00685f]">Docs</Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
