import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import brandLogoUrl from "../../../logo/logo.png";
import walletIconUrl from "../../../landing page/icon-wallet.svg";

/** Fixed top-edge scroll progress (MedVault teal → violet). */
function LandingScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  if (reduce) return null;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-[#bcc9c6]/25"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[61] h-[3px] origin-left bg-gradient-to-r from-[#6bd8cb] via-[#00685f] to-[#8792fe] shadow-[0_0_18px_rgba(107,216,203,0.4)]"
        style={{ scaleX: scrollYProgress }}
      />
    </>
  );
}

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const footerVariants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans selection:bg-[#89f5e7]/40">
      <LandingScrollProgress />
      <nav className="sticky top-0 z-50 w-full border-b border-[#bcc9c6]/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-4 md:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-[#00685f]">
            <img src={brandLogoUrl} alt="" className="h-7 w-7 object-contain" width={28} height={28} aria-hidden />
            <span>MedVault</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link to="/docs" className="text-[#3d4947] transition-colors hover:text-[#00685f]">
              How it Works
            </Link>
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
              <img src={walletIconUrl} alt="" className="h-4 w-4 shrink-0" width={16} height={16} aria-hidden />
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
            <Link to="/docs" className="hover:text-[#00685f]">How it works</Link>
            <Link to="/technology" className="hover:text-[#00685f]">Technology</Link>
            <Link to="/security" className="hover:text-[#00685f]">Security</Link>
            <Link to="/docs" className="hover:text-[#00685f]">Docs</Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
