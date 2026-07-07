import hre from "hardhat";
import { ethers } from "hardhat";
import type { BaseContract } from "ethers";
import { ENGINE_READER_ROLES, resolveRelayerAddresses } from "./timelockWiring";

export type WiringStatus = "done" | "ready" | "waiting" | "not_scheduled";

export interface PendingWiringRow {
    label: string;
    status: WiringStatus;
    eta?: bigint;
    etaIso?: string;
    waitHours?: number;
    detail?: string;
}

export async function getChainNow(): Promise<bigint> {
    const block = await ethers.provider.getBlock("latest");
    return BigInt(block?.timestamp ?? Math.floor(Date.now() / 1000));
}

export function formatEta(eta: bigint, now: bigint): { etaIso: string; waitHours: number } {
    const waitSec = eta > now ? Number(eta - now) : 0;
    return {
        etaIso: new Date(Number(eta) * 1000).toISOString(),
        waitHours: waitSec / 3600,
    };
}

export function classifyTimelock(eta: bigint, now: bigint, isDone: boolean): WiringStatus {
    if (isDone) return "done";
    if (eta === 0n) return "not_scheduled";
    if (now >= eta) return "ready";
    return "waiting";
}

function row(
    label: string,
    eta: bigint,
    now: bigint,
    isDone: boolean,
    detail?: string
): PendingWiringRow {
    const status = classifyTimelock(eta, now, isDone);
    const base: PendingWiringRow = { label, status, detail };
    if (eta > 0n && status !== "done") {
        const { etaIso, waitHours } = formatEta(eta, now);
        return { ...base, eta, etaIso, waitHours };
    }
    return base;
}

export type ApplyResult = "applied" | "waiting" | "done" | "failed" | "not_scheduled";

type AddressMap = Record<string, string>;

export async function tryApplyOnly(
    label: string,
    apply: () => Promise<unknown>
): Promise<ApplyResult> {
    try {
        const tx = await apply();
        if (
            tx &&
            typeof tx === "object" &&
            "wait" in tx &&
            typeof (tx as { wait: () => Promise<unknown> }).wait === "function"
        ) {
            await (tx as { wait: () => Promise<unknown> }).wait();
        }
        console.log(`✓ ${label}`);
        return "applied";
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("Timelock active")) {
            console.warn(`  ${label}: timelock still active — wait and re-run`);
            return "waiting";
        }
        if (
            msg.includes("Nothing") ||
            msg.includes("already") ||
            msg.includes("No pending") ||
            msg.includes("Unknown reader")
        ) {
            console.log(`  ${label}: already done`);
            return "done";
        }
        console.error(`  ${label}: FAILED — ${msg.slice(0, 200)}`);
        return "failed";
    }
}

const DAL_TIMELOCK_ABI = [
    "function applyAuthorizedLogger(address _logger) external",
    "function isAuthorizedLogger(address) view returns (bool)",
    "function loggerChangeEta(address) view returns (uint256)",
    "function pendingLoggerChanges(address) view returns (bool)",
];

/** Contracts that call DataAccessLog.logAction — must be authorized loggers. */
export function dalLoggerAddresses(addresses: {
    EligibilityEngine?: string;
    AnonymousPatientRegistry?: string;
    SponsorIncentiveVault?: string;
    ConsentManager?: string;
    TrialMilestoneManager?: string;
    PatientDocumentStore?: string;
}): string[] {
    return [
        addresses.EligibilityEngine,
        addresses.AnonymousPatientRegistry,
        addresses.SponsorIncentiveVault,
        addresses.ConsentManager,
        addresses.TrialMilestoneManager,
        addresses.PatientDocumentStore,
    ].filter((a): a is string => Boolean(a));
}

/** Schedule timelocked DAL logger auth for any contract not yet authorized (safe to re-run). */
export async function scheduleMissingDalLoggers(addresses: AddressMap): Promise<void> {
    const { ensureDataAccessLogger } = await import("../data-access-log-wiring");
    const dataAccessLog = await ethers.getContractAt("DataAccessLog", addresses.DataAccessLog);
    for (const logger of dalLoggerAddresses(addresses)) {
        const authorized = await dataAccessLog.isAuthorizedLogger(logger);
        if (!authorized) {
            await ensureDataAccessLogger(dataAccessLog, logger, true);
        }
    }
}

/** Apply-only DataAccessLog logger auth — never re-schedules a pending change. */
export async function applyDalLoggerIfReady(
    dataAccessLog: BaseContract,
    logger: string,
    status: boolean
): Promise<ApplyResult> {
    const label = `DAL logger ${logger.slice(0, 10)}… → ${status}`;
    const dal = new ethers.Contract(await dataAccessLog.getAddress(), DAL_TIMELOCK_ABI, dataAccessLog.runner);
    const current = await dal.isAuthorizedLogger(logger);
    if (current === status) return "done";

    const eta = await dal.loggerChangeEta(logger);
    const pending = await dal.pendingLoggerChanges(logger);
    const now = await getChainNow();

    if (eta === 0n) {
        console.log(`  ${label}: not scheduled`);
        return "not_scheduled";
    }
    if (now < eta) {
        const { etaIso, waitHours } = formatEta(eta, now);
        console.warn(`  ${label}: waiting until ${etaIso} (~${waitHours.toFixed(2)}h)`);
        return "waiting";
    }
    if (pending !== status) {
        console.warn(`  ${label}: pending value mismatch — manual review needed`);
        return "failed";
    }
    return tryApplyOnly(label, () => dal.applyAuthorizedLogger(logger));
}

const CETH_AUTH_ABI = [
    "function applyContractAuth(address _contract) external",
    "function authorizedContracts(address) view returns (bool)",
    "function contractAuthChangeEta(address) view returns (uint256)",
    "function pendingContractAuth(address) view returns (bool)",
];

/** Apply-only cETH contract auth — never re-schedules a pending change. */
export async function applyCethAuthIfReady(
    cETH: BaseContract,
    contract: string,
    authorize: boolean
): Promise<ApplyResult> {
    const label = `cETH ${authorize ? "authorize" : "deauthorize"} ${contract.slice(0, 10)}…`;
    const c = new ethers.Contract(await cETH.getAddress(), CETH_AUTH_ABI, cETH.runner);
    const current = await c.authorizedContracts(contract);
    if (current === authorize) return "done";

    const eta = await c.contractAuthChangeEta(contract);
    const pending = await c.pendingContractAuth(contract);
    const now = await getChainNow();

    if (eta === 0n) {
        console.log(`  ${label}: not scheduled`);
        return "not_scheduled";
    }
    if (now < eta) {
        const { etaIso, waitHours } = formatEta(eta, now);
        console.warn(`  ${label}: waiting until ${etaIso} (~${waitHours.toFixed(2)}h)`);
        return "waiting";
    }
    if (pending !== authorize) {
        console.warn(`  ${label}: pending value mismatch — manual review needed`);
        return "failed";
    }
    return tryApplyOnly(label, () => c.applyContractAuth(contract));
}

/** Read all timelock rows for a deployment (no txs). */
function addrEq(a: string, b: string | undefined): boolean {
    return Boolean(b && a.toLowerCase() === b.toLowerCase());
}

export async function auditPendingWiring(addresses: AddressMap): Promise<PendingWiringRow[]> {
    const now = await getChainNow();
    const rows: PendingWiringRow[] = [];

    const trialManager = await ethers.getContractAt("TrialManager", addresses.TrialManager);
    const engine = await ethers.getContractAt("EligibilityEngine", addresses.EligibilityEngine);
    const consentManager = await ethers.getContractAt("ConsentManager", addresses.ConsentManager);
    const vault = await ethers.getContractAt("SponsorIncentiveVault", addresses.SponsorIncentiveVault);
    const milestoneManager = await ethers.getContractAt("TrialMilestoneManager", addresses.TrialMilestoneManager);
    const automation = await ethers.getContractAt("MedVaultAutomation", addresses.MedVaultAutomation);
    const cETH = await ethers.getContractAt("ConfidentialETH", addresses.ConfidentialETH);
    const dataAccessLog = await ethers.getContractAt("DataAccessLog", addresses.DataAccessLog);

    const tmAuto = await trialManager.automationContract();
    rows.push(
        row(
            "TrialManager → automation",
            await trialManager.automationContractChangeEta(),
            now,
            tmAuto.toLowerCase() === addresses.MedVaultAutomation.toLowerCase()
        )
    );
    const tmEngine = await trialManager.eligibilityEngine();
    rows.push(
        row(
            "TrialManager → eligibilityEngine",
            await trialManager.eligibilityEngineChangeEta(),
            now,
            tmEngine.toLowerCase() === addresses.EligibilityEngine.toLowerCase()
        )
    );

    const readerDone: Record<string, boolean> = {
        automation: addrEq(await engine.automationContract(), addresses.MedVaultAutomation),
        authorizedRegistry: addrEq(await engine.authorizedRegistry(), addresses.MedVaultRegistry),
        consentGate: addrEq(await engine.consentGate(), addresses.EncryptedConsentGate),
        scoreLeaderboard: addrEq(await engine.scoreLeaderboard(), addresses.EncryptedScoreLeaderboard),
        sponsorIncentiveVault: addrEq(await engine.sponsorIncentiveVault(), addresses.SponsorIncentiveVault),
        eligibilityVerifier: addrEq(
            await engine.eligibilityVerifier(),
            addresses.HonkVerifier || addresses.EligibilityVerifier
        ),
        eligibilityVerifierEncrypted: addrEq(
            await engine.eligibilityVerifierEncrypted(),
            addresses.HonkVerifierEncrypted
        ),
        patientDocumentStore: addrEq(await engine.patientDocumentStore(), addresses.PatientDocumentStore),
    };
    for (const [name, role] of Object.entries(ENGINE_READER_ROLES)) {
        const eta = await engine.readerChangeEta(role);
        rows.push(row(`EligibilityEngine reader (${name})`, eta, now, readerDone[name] ?? false));
    }

    const engineDal = await engine.dataAccessLog();
    rows.push(
        row(
            "EligibilityEngine → dataAccessLog",
            await engine.dataAccessLogChangeEta(),
            now,
            engineDal.toLowerCase() === addresses.DataAccessLog.toLowerCase()
        )
    );

    const cmGate = await consentManager.consentGate();
    rows.push(
        row(
            "ConsentManager → consentGate",
            await consentManager.consentGateChangeEta(),
            now,
            addresses.EncryptedConsentGate
                ? cmGate.toLowerCase() === addresses.EncryptedConsentGate.toLowerCase()
                : cmGate !== ethers.ZeroAddress
        )
    );

    const vAuto = await vault.automationContract();
    rows.push(
        row(
            "Vault → automation",
            await vault.automationContractChangeEta(),
            now,
            vAuto.toLowerCase() === addresses.MedVaultAutomation.toLowerCase()
        )
    );
    const vMm = await vault.milestoneManager();
    rows.push(
        row(
            "Vault → milestoneManager",
            await vault.milestoneManagerChangeEta(),
            now,
            vMm.toLowerCase() === addresses.TrialMilestoneManager.toLowerCase()
        )
    );
    if (addresses.SponsorRegistry) {
        const vSr = await vault.sponsorRegistry();
        rows.push(
            row(
                "Vault → sponsorRegistry",
                await vault.sponsorRegistryChangeEta(),
                now,
                vSr.toLowerCase() === addresses.SponsorRegistry.toLowerCase()
            )
        );
    }
    const vDal = await vault.dataAccessLog();
    rows.push(
        row(
            "Vault → dataAccessLog",
            await vault.dataAccessLogChangeEta(),
            now,
            vDal.toLowerCase() === addresses.DataAccessLog.toLowerCase()
        )
    );

    const mmVault = await milestoneManager.vault();
    rows.push(
        row(
            "MilestoneManager → vault",
            await milestoneManager.vaultChangeEta(),
            now,
            mmVault.toLowerCase() === addresses.SponsorIncentiveVault.toLowerCase()
        )
    );

    const autoVault = await automation.vault();
    rows.push(
        row(
            "Automation → vault",
            await automation.vaultChangeEta(),
            now,
            autoVault.toLowerCase() === addresses.SponsorIncentiveVault.toLowerCase()
        )
    );
    if (addresses.AutomationReceiver) {
        const fwd = await automation.chainlinkForwarder();
        rows.push(
            row(
                "Automation → chainlinkForwarder",
                await automation.forwarderChangeEta(),
                now,
                fwd.toLowerCase() === addresses.AutomationReceiver.toLowerCase()
            )
        );
    }

    rows.push(
        row(
            "cETH authorize vault",
            await cETH.contractAuthChangeEta(addresses.SponsorIncentiveVault),
            now,
            await cETH.authorizedContracts(addresses.SponsorIncentiveVault)
        )
    );
    if (addresses.StakingManager) {
        rows.push(
            row(
                "cETH authorize staking",
                await cETH.contractAuthChangeEta(addresses.StakingManager),
                now,
                await cETH.authorizedContracts(addresses.StakingManager)
            )
        );
    }

    const dal = new ethers.Contract(await dataAccessLog.getAddress(), DAL_TIMELOCK_ABI, dataAccessLog.runner);
    for (const logger of dalLoggerAddresses(addresses)) {
        const eta = await dal.loggerChangeEta(logger);
        rows.push(row(`DAL logger ${logger.slice(0, 10)}…`, eta, now, await dal.isAuthorizedLogger(logger)));
    }

    if (addresses.MedVaultRegistry) {
        const reg = await ethers.getContractAt("MedVaultRegistry", addresses.MedVaultRegistry);
        for (const relayer of resolveRelayerAddresses()) {
            rows.push(
                row(
                    `Registry relayer ${relayer.slice(0, 10)}…`,
                    await reg.relayerAuthChangeEta(relayer),
                    now,
                    await reg.authorizedRelayers(relayer)
                )
            );
            rows.push(
                row(
                    `cETH relayer ${relayer.slice(0, 10)}…`,
                    await cETH.contractAuthChangeEta(relayer),
                    now,
                    await cETH.authorizedContracts(relayer)
                )
            );
        }
    }

    return rows;
}

export function printPendingWiringReport(rows: PendingWiringRow[], now: bigint): void {
    const ready = rows.filter((r) => r.status === "ready");
    const waiting = rows.filter((r) => r.status === "waiting");
    const notScheduled = rows.filter((r) => r.status === "not_scheduled");
    const done = rows.filter((r) => r.status === "done");

    console.log(`Chain time: ${new Date(Number(now) * 1000).toISOString()}\n`);
    console.log(`Summary: ${done.length} done | ${ready.length} ready to apply | ${waiting.length} waiting | ${notScheduled.length} not scheduled\n`);

    const groups: [string, PendingWiringRow[]][] = [
        ["READY NOW — run npm run deploy:apply-wiring:sepolia", ready],
        ["WAITING (timelock)", waiting],
        ["NOT SCHEDULED", notScheduled],
        ["DONE", done],
    ];

    for (const [title, items] of groups) {
        if (items.length === 0) continue;
        console.log(`── ${title} (${items.length}) ──`);
        for (const r of items) {
            if (r.status === "waiting" && r.etaIso) {
                console.log(`  ${r.label}  →  ${r.etaIso}  (~${r.waitHours?.toFixed(2)}h)`);
            } else {
                console.log(`  ${r.label}`);
            }
        }
        console.log();
    }

    if (waiting.length > 0) {
        const latest = waiting.reduce((max, r) => (r.eta && r.eta > max ? r.eta : max), 0n);
        if (latest > 0n) {
            const { etaIso, waitHours } = formatEta(latest, now);
            console.log(`Re-run after: ${etaIso}  (~${waitHours.toFixed(2)}h from now)`);
            console.log(`  npm run deploy:apply-wiring:sepolia\n`);
        }
    } else if (ready.length > 0) {
        console.log("All pending items are ready — run:\n  npm run deploy:apply-wiring:sepolia\n");
    } else {
        console.log("Nothing pending — wiring complete.\n");
    }
}

/** Apply every pending timelock without scheduling new changes. */
export async function applyAllPendingWiring(addresses: AddressMap): Promise<void> {
    const rows = await auditPendingWiring(addresses);
    const ready = new Set(rows.filter((r) => r.status === "ready").map((r) => r.label));
    const shouldApply = (label: string) => ready.has(label);

    const trialManager = await ethers.getContractAt("TrialManager", addresses.TrialManager);
    const engine = await ethers.getContractAt("EligibilityEngine", addresses.EligibilityEngine);
    const consentManager = await ethers.getContractAt("ConsentManager", addresses.ConsentManager);
    const vault = await ethers.getContractAt("SponsorIncentiveVault", addresses.SponsorIncentiveVault);
    const milestoneManager = await ethers.getContractAt("TrialMilestoneManager", addresses.TrialMilestoneManager);
    const automation = await ethers.getContractAt("MedVaultAutomation", addresses.MedVaultAutomation);
    const cETH = await ethers.getContractAt("ConfidentialETH", addresses.ConfidentialETH);
    const dataAccessLog = await ethers.getContractAt("DataAccessLog", addresses.DataAccessLog);

    if (shouldApply("TrialManager → automation")) {
        await tryApplyOnly("TrialManager.applyAutomationContract", () => trialManager.applyAutomationContract());
    }
    if (shouldApply("TrialManager → eligibilityEngine")) {
        await tryApplyOnly("TrialManager.applyEligibilityEngine", () => trialManager.applyEligibilityEngine());
    }

    for (const [name, role] of Object.entries(ENGINE_READER_ROLES)) {
        if (shouldApply(`EligibilityEngine reader (${name})`)) {
            await tryApplyOnly(`EligibilityEngine.applyAuthorizedReader(${name})`, () =>
                engine.applyAuthorizedReader(role)
            );
        }
    }

    if (shouldApply("EligibilityEngine → dataAccessLog")) {
        await tryApplyOnly("EligibilityEngine.applyDataAccessLog", () => engine.applyDataAccessLog());
    }
    if (shouldApply("ConsentManager → consentGate")) {
        await tryApplyOnly("ConsentManager.applyConsentGate", () => consentManager.applyConsentGate());
    }
    if (shouldApply("Vault → automation")) {
        await tryApplyOnly("Vault.applyAutomationContract", () => vault.applyAutomationContract());
    }
    if (shouldApply("Vault → milestoneManager")) {
        await tryApplyOnly("Vault.applyMilestoneManager", () => vault.applyMilestoneManager());
    }
    if (addresses.SponsorRegistry && shouldApply("Vault → sponsorRegistry")) {
        await tryApplyOnly("Vault.applySponsorRegistry", () => vault.applySponsorRegistry());
    }
    if (shouldApply("Vault → dataAccessLog")) {
        await tryApplyOnly("Vault.applyDataAccessLog", () => vault.applyDataAccessLog());
    }
    if (shouldApply("MilestoneManager → vault")) {
        await tryApplyOnly("MilestoneManager.applyVault", () => milestoneManager.applyVault());
    }
    if (shouldApply("Automation → vault")) {
        await tryApplyOnly("Automation.applyVault", () => automation.applyVault());
    }
    if (shouldApply("Automation → chainlinkForwarder")) {
        await tryApplyOnly("Automation.applyChainlinkForwarder", () => automation.applyChainlinkForwarder());
    }

    if (shouldApply("cETH authorize vault")) {
        await applyCethAuthIfReady(cETH, addresses.SponsorIncentiveVault, true);
    }
    if (addresses.StakingManager && shouldApply("cETH authorize staking")) {
        await applyCethAuthIfReady(cETH, addresses.StakingManager, true);
    }

    for (const logger of dalLoggerAddresses(addresses)) {
        if (logger && shouldApply(`DAL logger ${logger.slice(0, 10)}…`)) {
            await applyDalLoggerIfReady(dataAccessLog, logger, true);
        }
    }

    if (addresses.MedVaultRegistry) {
        const medVaultRegistry = await ethers.getContractAt("MedVaultRegistry", addresses.MedVaultRegistry);
        for (const relayerAddr of resolveRelayerAddresses()) {
            if (shouldApply(`Registry relayer ${relayerAddr.slice(0, 10)}…`)) {
                await tryApplyOnly(`MedVaultRegistry.applyRelayerAuth(${relayerAddr})`, () =>
                    medVaultRegistry.applyRelayerAuth(relayerAddr)
                );
            }
            if (shouldApply(`cETH relayer ${relayerAddr.slice(0, 10)}…`)) {
                await applyCethAuthIfReady(cETH, relayerAddr, true);
            }
        }
    }

    if (hre.network.name !== "hardhat") {
        const after = await auditPendingWiring(addresses);
        const waiting = after.filter((r) => r.status === "waiting").length;
        const readyLeft = after.filter((r) => r.status === "ready").length;
        if (waiting > 0) {
            console.log(`\n${waiting} item(s) still waiting — run: npm run deploy:check-pending:sepolia`);
        } else if (readyLeft > 0) {
            console.log("\nSome items still ready — re-run: npm run deploy:apply-wiring:sepolia");
        } else {
            console.log("\nAll wiring items done or not scheduled.");
        }
    }
}
