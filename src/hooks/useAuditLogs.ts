import { useState, useEffect } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { getDataAccessLog } from "../lib/contracts";

export interface AuditLogEntry {
    actionType: string;
    trialId: string;
    patientHash: string;
    timestamp: Date;
    performer: string;
}

/** Must match `DataAccessLog.ActionType` enum order (Solidity). */
const ACTION_TYPES = [
    "PROFILE_SUBMISSION",
    "CONSENT_GRANTED",
    "ELIGIBILITY_CHECKED",
    "APPLICATION_STATUS_CHANGED",
    "MILESTONE_COMPLETED",
    "REWARDS_DISTRIBUTED",
    "PARTICIPANT_JOINED_POOL",
] as const;

export function useAuditLogs() {
    const { readOnlyProvider } = useWeb3();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchLogs = async () => {
            if (!readOnlyProvider) {
                if (mounted) {
                    setLoading(false);
                    setLogs([]);
                }
                return;
            }

            try {
                if (mounted) setLoading(true);
                const contract = getDataAccessLog(readOnlyProvider);
                const count = await contract.getLogCount();

                const fetchedLogs: AuditLogEntry[] = [];
                // Fetch in reverse order (newest first)
                for (let i = Number(count) - 1; i >= 0; i--) {
                    const log = await contract.getLog(i);
                    const actionIdx = Number(log.action);
                    const actionType =
                        Number.isFinite(actionIdx) && actionIdx >= 0 && actionIdx < ACTION_TYPES.length
                            ? ACTION_TYPES[actionIdx]
                            : typeof log.action === "string" && log.action.length > 0
                              ? log.action
                              : `UNKNOWN_ACTION_${String(log.action)}`;

                    fetchedLogs.push({
                        actionType,
                        trialId: log.trialId.toString(),
                        patientHash: log.patientHash,
                        timestamp: new Date(Number(log.timestamp) * 1000),
                        performer: log.performer,
                    });
                }

                if (mounted) {
                    setLogs(fetchedLogs);
                    setError(null);
                }
            } catch (err: any) {
                console.error("Failed to fetch audit logs:", err);
                if (mounted) setError(err.message || "Failed to fetch logs");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchLogs();

        return () => {
            mounted = false;
        };
    }, [readOnlyProvider]);

    return { logs, loading, error };
}
