import { useMemo } from "react";
import { Trial } from "../types";
import { formatEthCompact } from "../lib/parseCompensation";
import {
  estimateParticipantPayoutEth,
  payoutUtilizationPct,
  weiToEth,
} from "../lib/incentivePoolMetrics";
import { useSponsorDashboard } from "./useSponsorDashboard";
import { useTrials } from "./useTrials";

export type TrialPortfolioRow = Trial & {
  fundedEth: number;
  paidToParticipantsEth: number;
  payoutPct: number;
};

export type PortfolioMetrics = {
  activeTrials: number;
  startingSoon: number;
  enrollingCount: number;
  pendingCount: number;
  pendingReviewCount: number;
  allocatedEth: number;
  paidToParticipantsEth: number;
  payoutUtilizationPct: number;
  trialsWithPayoutAlert: number;
  trialRows: TrialPortfolioRow[];
};

const STALE_PENDING_SEC = 7 * 24 * 3600;
const STARTING_SOON_SEC = 30 * 24 * 3600;

function attachPayoutFields(trials: Trial[]): TrialPortfolioRow[] {
  return trials.map((t) => {
    const fundedEth = weiToEth(t.poolFundedWei);
    const paidToParticipantsEth = estimateParticipantPayoutEth(
      t.poolFundedWei,
      t.milestones,
      t.incentivePool,
    );
    const payoutPct = payoutUtilizationPct(fundedEth, paidToParticipantsEth);
    return { ...t, fundedEth, paidToParticipantsEth, payoutPct };
  });
}

export function useSponsorPortfolioMetrics(account?: string) {
  const sponsor = account || undefined;
  const {
    trials,
    loading: trialsLoading,
    refreshing: trialsRefreshing,
    error: trialsError,
  } = useTrials(sponsor, sponsor);
  const { charts, biasIndicators, recentActivity, loading: dashLoading, error: dashError } =
    useSponsorDashboard();

  const metrics = useMemo((): PortfolioMetrics => {
    const now = Math.floor(Date.now() / 1000);
    const trialRows = attachPayoutFields(trials);

    const activeTrials = trials.filter((t) => t.active).length;
    const startingSoon = trials.filter((t) => {
      if (!t.active || !t.endTime) return false;
      const end = parseInt(String(t.endTime), 10);
      return end > now && end - now <= STARTING_SOON_SEC;
    }).length;

    let enrollingCount = 0;
    let pendingCount = 0;
    let pendingReviewCount = 0;

    for (const t of trials) {
      const accepted = t.acceptedCount ?? 0;
      const pending = t.pendingApplicationCount ?? 0;
      enrollingCount += accepted + pending;
      pendingCount += pending;

      const updated = t.updatedAtSec ?? 0;
      if (pending > 0 && updated > 0 && now - updated > STALE_PENDING_SEC) {
        pendingReviewCount += 1;
      }
    }

    let allocatedEth = 0;
    let paidToParticipantsEth = 0;
    let trialsWithPayoutAlert = 0;

    for (const row of trialRows) {
      allocatedEth += row.fundedEth;
      paidToParticipantsEth += row.paidToParticipantsEth;
      if (row.fundedEth > 0 && row.payoutPct > 80) trialsWithPayoutAlert += 1;
    }

    const portfolioPayoutPct = payoutUtilizationPct(allocatedEth, paidToParticipantsEth);

    return {
      activeTrials,
      startingSoon,
      enrollingCount,
      pendingCount,
      pendingReviewCount,
      allocatedEth,
      paidToParticipantsEth,
      payoutUtilizationPct: portfolioPayoutPct,
      trialsWithPayoutAlert,
      trialRows,
    };
  }, [trials]);

  return {
    metrics,
    charts,
    biasIndicators,
    recentActivity,
    loading: trialsLoading || trialsRefreshing || dashLoading,
    error: trialsError || dashError,
    formatEthCompact,
  };
}
