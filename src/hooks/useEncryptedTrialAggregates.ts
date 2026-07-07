import { useCallback, useEffect, useState } from "react";
import { getEncryptedScoreLeaderboard } from "../lib/contracts";
import { getZamaSDK } from "../lib/fhe";
import { normalizeFheHandle } from "../lib/criteriaSchema";
import { useWeb3 } from "../lib/Web3Context";

export type EncryptedTrialAggregate = {
    trialId: string;
    applicantCount: number | null;
    avgScore: number | null;
    error?: string;
};

type DecryptedValues = Record<string, unknown>;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const UNAUTHORIZED_AGGREGATE_MESSAGE =
    "Connected wallet is not authorized on EncryptedScoreLeaderboard for this trial. Aggregate decrypt is unavailable until leaderboard sponsor auth is wired.";
const ENCRYPTED_AGGREGATE_UNAVAILABLE_MESSAGE =
    "Applicant count is indexed, but encrypted aggregate decrypt is unavailable for this trial.";

function handleToHex(value: unknown): `0x${string}` {
    const n = normalizeFheHandle(value);
    if (n === 0n) return `0x${"0".repeat(64)}` as `0x${string}`;
    return (`0x${n.toString(16).padStart(64, "0")}`) as `0x${string}`;
}

function readDecryptedNumber(values: DecryptedValues, handle: `0x${string}`): number {
    const value = values[handle] ?? values[handle.toLowerCase()] ?? values[handle.toUpperCase()];
    if (value == null) {
        throw new Error(`KMS decrypt response missing handle ${handle.slice(0, 10)}...`);
    }
    return Number(value);
}

function isUnauthorizedAggregateError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /Not authorized for this trial/i.test(message);
}

export function useEncryptedTrialAggregates(trialIds: string[]) {
    const { chainId, signer } = useWeb3();
    const [aggregates, setAggregates] = useState<EncryptedTrialAggregate[]>([]);
    const [loading, setLoading] = useState(false);
    const [decryptError, setDecryptError] = useState<string | null>(null);

    const decryptAggregates = useCallback(async () => {
        if (!signer || trialIds.length === 0) return;
        setLoading(true);
        setDecryptError(null);
        try {
            const board = getEncryptedScoreLeaderboard(signer, chainId ?? undefined);
            const boardAddr = await board.getAddress();
            const connectedAccount = (await signer.getAddress()).toLowerCase();
            let permitGranted = false;

            const rows: EncryptedTrialAggregate[] = [];
            for (const rawId of trialIds.slice(0, 12)) {
                const trialId = BigInt(String(rawId).replace(/^#/, ""));
                let publicApplicantCount: number | null = null;
                try {
                    publicApplicantCount = Number(await board.getApplicantCount(trialId));
                    const [owner, trialSponsor, globalAuthorized, trialAuthorized] = await Promise.all([
                        board.owner(),
                        board.trialSponsor(trialId),
                        board.globalAuthorizedSponsors(connectedAccount),
                        board.authorizedSponsorsForTrial(trialId, connectedAccount),
                    ]);
                    const authorized =
                        connectedAccount === String(owner).toLowerCase() ||
                        (String(trialSponsor) !== ZERO_ADDRESS && connectedAccount === String(trialSponsor).toLowerCase()) ||
                        Boolean(globalAuthorized) ||
                        Boolean(trialAuthorized);

                    if (!authorized) {
                        rows.push({
                            trialId: rawId,
                            applicantCount: publicApplicantCount,
                            avgScore: null,
                            error: UNAUTHORIZED_AGGREGATE_MESSAGE,
                        });
                        continue;
                    }

                    if (!permitGranted) {
                        const sdk = getZamaSDK();
                        await sdk.permits.grantPermit([boardAddr as `0x${string}`]);
                        permitGranted = true;
                    }

                    const callOverrides = { from: connectedAccount };
                    const countCt = await board.getAggregateApplicantCount.staticCall(trialId, callOverrides);
                    const sumCt = await board.getAggregateScoreSum.staticCall(trialId, callOverrides);
                    const countHandle = handleToHex(countCt);
                    const sumHandle = handleToHex(sumCt);

                    if (countHandle === `0x${"0".repeat(64)}`) {
                        rows.push({
                            trialId: rawId,
                            applicantCount: publicApplicantCount ?? 0,
                            avgScore: null,
                            error: publicApplicantCount && publicApplicantCount > 0
                                ? ENCRYPTED_AGGREGATE_UNAVAILABLE_MESSAGE
                                : undefined,
                        });
                        continue;
                    }

                    const sdk = getZamaSDK();
                    const decrypted = await sdk.decryption.decryptValues([
                        { encryptedValue: countHandle, contractAddress: boardAddr as `0x${string}` },
                        { encryptedValue: sumHandle, contractAddress: boardAddr as `0x${string}` },
                    ]) as DecryptedValues;
                    const count = readDecryptedNumber(decrypted, countHandle);
                    const sum = readDecryptedNumber(decrypted, sumHandle);
                    rows.push({
                        trialId: rawId,
                        applicantCount: count,
                        avgScore: count > 0 ? Math.round((sum / count) * 10) / 10 : null,
                    });
                } catch (e) {
                    rows.push({
                        trialId: rawId,
                        applicantCount: publicApplicantCount,
                        avgScore: null,
                        error: isUnauthorizedAggregateError(e)
                            ? UNAUTHORIZED_AGGREGATE_MESSAGE
                            : ENCRYPTED_AGGREGATE_UNAVAILABLE_MESSAGE,
                    });
                }
            }
            setAggregates(rows);
        } catch (e) {
            setDecryptError(e instanceof Error ? e.message : "FHE decrypt unavailable");
            setAggregates([]);
        } finally {
            setLoading(false);
        }
    }, [chainId, signer, trialIds]);

    useEffect(() => {
        setAggregates([]);
        setDecryptError(null);
    }, [trialIds.join(",")]);

    return { aggregates, loading, decryptError, decryptAggregates };
}
