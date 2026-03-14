/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LandingLayout } from "./components/layout/LandingLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { LandingPage } from "./pages/LandingPage";
import { PatientDashboard } from "./pages/PatientDashboard";
import { PatientVaultPage } from "./pages/PatientVaultPage";
import { PatientTrialsPage } from "./pages/PatientTrialsPage";
import { PatientAppliedTrialsPage } from "./pages/PatientAppliedTrialsPage";
import { SponsorDashboard } from "./pages/SponsorDashboard";
import { SponsorTrialsPage } from "./pages/SponsorTrialsPage";
import { SponsorCreateTrialPage } from "./pages/SponsorCreateTrialPage";
import { SponsorTrialDetailsPage } from "./pages/SponsorTrialDetailsPage";
import { SponsorMatchesPage } from "./pages/SponsorMatchesPage";
import { SponsorAnalyticsPage } from "./pages/SponsorAnalyticsPage";
import { SponsorSettingsPage } from "./pages/SponsorSettingsPage";
import { SponsorAuditLogPage } from './pages/SponsorAuditLogPage';
import { ConsentLogPage } from "./pages/ConsentLogPage";
import { TechnologyPage } from "./pages/TechnologyPage";
import { SecurityPage } from "./pages/SecurityPage";
import AdminSponsorsPage from "./pages/AdminSponsorsPage";
import { SponsorGuard } from "./components/layout/SponsorGuard";
import { DocsLayout } from "./pages/docs/DocsLayout";
import { IntroductionDoc } from "./pages/docs/IntroductionDoc";
import { ArchitectureDoc } from "./pages/docs/ArchitectureDoc";
import { FhePrimitivesDoc } from "./pages/docs/FhePrimitivesDoc";
import { EligibilityEngineDoc } from "./pages/docs/EligibilityEngineDoc";
import { SmartContractsDoc } from "./pages/docs/SmartContractsDoc";
import { SponsorSystemDoc } from "./pages/docs/SponsorSystemDoc";
import { ClientEncryptionDoc } from "./pages/docs/ClientEncryptionDoc";
import { SubgraphIndexingDoc } from "./pages/docs/SubgraphIndexingDoc";
import { FrontendArchitectureDoc } from "./pages/docs/FrontendArchitectureDoc";
import { UserGuideDoc } from "./pages/docs/UserGuideDoc";
import { DeploymentGuideDoc } from "./pages/docs/DeploymentGuideDoc";
import { PrivateStakingDoc } from "./pages/docs/PrivateStakingDoc";
import { TestingVerificationDoc } from "./pages/docs/TestingVerificationDoc";
import { SecurityModelDoc } from "./pages/docs/SecurityModelDoc";
import { ComplianceDoc } from "./pages/docs/ComplianceDoc";

import { Web3Provider } from "./lib/Web3Context";
import { EncryptedDataProvider } from "./lib/EncryptedDataContext";
import { ScrollToTop } from "./components/ui/ScrollToTop";

export default function App() {
  return (
    <Web3Provider>
      <EncryptedDataProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Landing Page Route */}
            <Route
              path="/"
              element={
                <LandingLayout>
                  <LandingPage />
                </LandingLayout>
              }
            />

            <Route
              path="/technology"
              element={
                <LandingLayout>
                  <TechnologyPage />
                </LandingLayout>
              }
            />
            <Route
              path="/security"
              element={
                <LandingLayout>
                  <SecurityPage />
                </LandingLayout>
              }
            />

            {/* Patient Dashboard Routes */}
            <Route
              path="/patient"
              element={
                <DashboardLayout role="patient">
                  <PatientDashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/patient/vault"
              element={
                <DashboardLayout role="patient">
                  <PatientVaultPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/patient/trials"
              element={
                <DashboardLayout role="patient">
                  <PatientTrialsPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/patient/applied"
              element={
                <DashboardLayout role="patient">
                  <PatientAppliedTrialsPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/patient/consent"
              element={
                <DashboardLayout role="patient">
                  <ConsentLogPage />
                </DashboardLayout>
              }
            />

            {/* Sponsor Dashboard Routes — all guarded by on-chain SponsorRegistry verification */}
            <Route
              path="/sponsor"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorDashboard />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            <Route
              path="/sponsor/trials"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorTrialsPage />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            <Route
              path="/sponsor/trials/create"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorCreateTrialPage />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            <Route
              path="/sponsor/trials/:id"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorTrialDetailsPage />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            <Route
              path="/sponsor/matches"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorMatchesPage />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            <Route
              path="/sponsor/analytics"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorAnalyticsPage />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            <Route
              path="/sponsor/audit"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorAuditLogPage />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            <Route
              path="/sponsor/settings"
              element={
                <SponsorGuard>
                  <DashboardLayout role="sponsor">
                    <SponsorSettingsPage />
                  </DashboardLayout>
                </SponsorGuard>
              }
            />
            {/* Admin sponsors page intentionally left open — allows unverified wallets to apply */}
            <Route
              path="/admin/sponsors"
              element={
                <DashboardLayout role="sponsor">
                  <AdminSponsorsPage />
                </DashboardLayout>
              }
            />

            {/* Documentation Routes */}
            <Route
              path="/docs"
              element={
                <DocsLayout>
                  <IntroductionDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/architecture"
              element={
                <DocsLayout>
                  <ArchitectureDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/fhe-primitives"
              element={
                <DocsLayout>
                  <FhePrimitivesDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/engine"
              element={
                <DocsLayout>
                  <EligibilityEngineDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/contracts"
              element={
                <DocsLayout>
                  <SmartContractsDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/sponsor-system"
              element={
                <DocsLayout>
                  <SponsorSystemDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/client-encryption"
              element={
                <DocsLayout>
                  <ClientEncryptionDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/subgraph"
              element={
                <DocsLayout>
                  <SubgraphIndexingDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/frontend"
              element={
                <DocsLayout>
                  <FrontendArchitectureDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/guides"
              element={
                <DocsLayout>
                  <UserGuideDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/staking"
              element={
                <DocsLayout>
                  <PrivateStakingDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/deployment"
              element={
                <DocsLayout>
                  <DeploymentGuideDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/testing"
              element={
                <DocsLayout>
                  <TestingVerificationDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/security-model"
              element={
                <DocsLayout>
                  <SecurityModelDoc />
                </DocsLayout>
              }
            />
            <Route
              path="/docs/compliance"
              element={
                <DocsLayout>
                  <ComplianceDoc />
                </DocsLayout>
              }
            />

            {/* Fallback for old consent route */}
            <Route path="/consent" element={<Navigate to="/patient/consent" replace />} />
          </Routes>
        </Router>
      </EncryptedDataProvider>
    </Web3Provider>
  );
}
