import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { LayoutPatient } from "./layouts/LayoutPatient";
import { LayoutSponsor } from "./layouts/LayoutSponsor";
import { PatientDashboard } from "./pages/PatientDashboard";
import { PatientApply } from "./pages/PatientApply";
import { PatientResults } from "./pages/PatientResults";
import { PatientIdentity } from "./pages/PatientIdentity";
import { PatientConsentLogs } from "./pages/PatientConsentLogs";
import { PatientFindTrials } from "./pages/PatientFindTrials";
import { PatientMedicalVault } from "./pages/PatientMedicalVault";
import { SponsorDashboard } from "./pages/SponsorDashboard";
import { SponsorActiveTrials } from "./pages/SponsorActiveTrials";
import { SponsorPatientMatches } from "./pages/SponsorPatientMatches";
import { SponsorAnalytics } from "./pages/SponsorAnalytics";
import { SponsorAuditLogs } from "./pages/SponsorAuditLogs";
import { SponsorVerification } from "./pages/SponsorVerification";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/technology" element={<div className="p-12 text-on-surface">Technology Page</div>} />
        <Route path="/security" element={<div className="p-12 text-on-surface">Security Page</div>} />
        <Route path="/consent" element={<Navigate to="/patient/consent-logs" replace />} />
        
        {/* Admin & Docs */}
        <Route path="/admin/sponsors" element={<div className="p-12 text-on-surface">Admin Sponsors Verify</div>} />
        <Route path="/docs/*" element={<div className="p-12 text-on-surface">Documentation Pages</div>} />

        {/* Patient Dashboard Type */}
        <Route path="/patient" element={<LayoutPatient />}>
          <Route index element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="medical-vault" element={<PatientMedicalVault />} />
          <Route path="find-trials" element={<PatientFindTrials />} />
          <Route path="consent-logs" element={<PatientConsentLogs />} />
          <Route path="applications" element={<PatientApply />} />
          <Route path="results" element={<PatientResults />} />
          <Route path="identity" element={<PatientIdentity />} />
          <Route path="settings" element={<div className="p-12 text-on-surface">Settings</div>} />
        </Route>

        {/* Sponsor Dashboard Type */}
        <Route path="/sponsor" element={<LayoutSponsor />}>
          <Route index element={<Navigate to="/sponsor/dashboard" replace />} />
          <Route path="dashboard" element={<SponsorDashboard />} />
          <Route path="active-trials" element={<SponsorActiveTrials />} />
          <Route path="patient-matches" element={<SponsorPatientMatches />} />
          <Route path="analytics" element={<SponsorAnalytics />} />
          <Route path="audit-logs" element={<SponsorAuditLogs />} />
          <Route path="profile-settings" element={<div className="p-12 text-on-surface">Profile Settings</div>} />
          <Route path="verification" element={<SponsorVerification />} />
          
          {/* Canonical dynamic/lifecycle endpoints mapped */}
          <Route path="trials/create" element={<div className="p-12 text-on-surface">Create Trial Wizard</div>} />
          <Route path="trials/:id" element={<div className="p-12 text-on-surface">Manage Protocol Scope</div>} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
