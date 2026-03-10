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

const ACTION_TYPES = [
    "PROFILE_SUBMISSION",
    "CONSENT_GRANTED",
    "ELIGIBILITY_CHECKED",
    "APPLICATION_STATUS_CHANGED",
    "MILESTONE_COMPLETED",
    "REWARDS_DISTRIBUTED"
];

export function useAuditLogs() {
    const { signer, provider } = useWeb3();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchLogs = async () => {
            if (!provider) {
                if (mounted) {
                    setLoading(false);
                    setLogs([]);
                }
                return;
            }

            try {
                if (mounted) setLoading(true);
                // Type assertion to bypass ethers v6 strict typing for read-only provider calls
                const contract = getDataAccessLog((signer || provider) as any);
                const count = await contract.getLogCount();

                const fetchedLogs: AuditLogEntry[] = [];
                // Fetch in reverse order (newest first)
                for (let i = Number(count) - 1; i >= 0; i--) {
                    const log = await contract.getLog(i);
                    fetchedLogs.push({
                        actionType: ACTION_TYPES[log.action] || `UNKNOWN_ACTION_${log.action}`,
                        trialId: log.trialId.toString(),
                        patientHash: log.patientHash,
                        timestamp: new Date(Number(log.timestamp) * 1000),
                        performer: log.performer
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
    }, [provider]);

    return { logs, loading, error };
}
