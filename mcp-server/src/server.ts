import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ethers } from "ethers";
import {
  ALLOWED_SUBGRAPH_QUERY_NAMES,
  PROTOCOL_CONTRACTS,
  checkWiring,
  createTrialOnChain,
  deactivateTrial,
  distributePartialMilestone,
  fetchAuditLogsFromChain,
  fundTrialPool,
  getContract,
  getSponsorVerification,
  getTrialPoolReclaimStatus,
  postSubgraph,
  reclaimUndistributedPool,
  registerAnonymousParticipantByNullifier,
  setTrialMilestones,
  updateTrialApplicationStatus,
  computeMilestoneDeadlines,
  normalizeTxError,
  type ContractName,
} from "@medvault/core";
import { MedVaultSDK } from "@medvault/sdk";
import type { MedVaultMcpContext } from "./context.js";
import { SERVER_VERSION as MCP_VERSION } from "./context.js";

function jsonText(data: unknown): { content: { type: "text"; text: string }[] } {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function createMedVaultMcpServer(ctx: MedVaultMcpContext): McpServer {
  const server = new McpServer({
    name: "medvault",
    version: MCP_VERSION,
  });

  server.tool(
    "medvault_get_config",
    "Deployed addresses, env URLs, server version, and optional signer address (if MCP_PRIVATE_KEY set).",
    {},
    async () => {
      let signer = null;
      let signerAddress: string | null = null;
      try {
        signer = ctx.getSigner();
        signerAddress = await signer.getAddress();
      } catch {
        /* no key */
      }
      const sdk = MedVaultSDK.create({
        ...ctx.config,
        provider: ctx.provider,
        signer: signer ?? undefined,
      });
      return jsonText({
        serverVersion: MCP_VERSION,
        sdkPackage: "@medvault/sdk",
        networkKey: ctx.config.networkKey,
        chainId: Number(sdk.chainId),
        rpcUrl: ctx.config.rpcUrl,
        subgraphUrl: ctx.config.subgraphUrl || null,
        relayerUrl: ctx.config.relayerUrl || null,
        sponsorOpenAccess: ctx.config.sponsorOpenAccess ?? false,
        signerAddress,
        addresses: sdk.protocol.getAddresses(),
      });
    }
  );

  server.tool(
    "medvault_list_protocol_contracts",
    "Canonical MedVault protocol contract catalog (roles, key functions).",
    {},
    async () => jsonText({ contracts: PROTOCOL_CONTRACTS })
  );

  server.tool(
    "medvault_check_wiring",
    "Verify SponsorIncentiveVault, MedVaultAutomation, TrialMilestoneManager, and TrialManager cross-references.",
    {},
    async () => jsonText(await checkWiring(ctx.provider, ctx.config.networkKey))
  );

  server.tool(
    "medvault_subgraph_query",
    "Run an allowlisted GraphQL query against MEDVAULT_SUBGRAPH_URL.",
    {
      queryName: z.enum(ALLOWED_SUBGRAPH_QUERY_NAMES as [string, ...string[]]),
      variables: z.record(z.unknown()).optional(),
    },
    async ({ queryName, variables }) =>
      jsonText(await postSubgraph(ctx.config.subgraphUrl, queryName, variables))
  );

  server.tool(
    "medvault_get_active_trials",
    "List active trials from the subgraph.",
    {
      first: z.number().int().min(1).max(100).optional().default(50),
      skip: z.number().int().min(0).optional().default(0),
    },
    async ({ first, skip }) =>
      jsonText(await postSubgraph(ctx.config.subgraphUrl, "GetActiveTrials", { first, skip }))
  );

  server.tool(
    "medvault_get_sponsor_trials",
    "Trials owned by a sponsor address.",
    {
      sponsor: z.string().describe("Sponsor wallet address (0x...)"),
    },
    async ({ sponsor }) =>
      jsonText(
        await postSubgraph(ctx.config.subgraphUrl, "GetTrialsBySponsor", {
          sponsor: sponsor.toLowerCase(),
        })
      )
  );

  server.tool(
    "medvault_get_sponsor_matches",
    "Sponsor trial matches: applications, eligibility, consents, anonymous submissions.",
    {
      sponsor: z.string(),
    },
    async ({ sponsor }) =>
      jsonText(
        await postSubgraph(ctx.config.subgraphUrl, "GetSponsorData", {
          sponsor: sponsor.toLowerCase(),
        })
      )
  );

  server.tool(
    "medvault_get_sponsor_stats",
    "Sponsor entity with trial/application aggregates from subgraph.",
    {
      sponsor: z.string(),
    },
    async ({ sponsor }) =>
      jsonText(
        await postSubgraph(ctx.config.subgraphUrl, "GetSponsorStats", {
          sponsor: sponsor.toLowerCase(),
        })
      )
  );

  server.tool(
    "medvault_get_audit_logs",
    "Audit logs for a sponsor's trials (subgraph + optional chain fallback).",
    {
      sponsor: z.string(),
      first: z.number().int().min(1).max(500).optional().default(200),
    },
    async ({ sponsor, first }) => {
      const sponsorLower = sponsor.toLowerCase();
      const trialData = await postSubgraph<{ trials: { id: string }[] }>(
        ctx.config.subgraphUrl,
        "GetSponsorTrialIds",
        { sponsor: sponsorLower }
      );
      const trialIds = (trialData.trials ?? []).map((t) => t.id);
      const trialIdSet = new Set(trialIds);

      let subgraphLogs: unknown[] = [];
      if (trialIds.length > 0) {
        const sg = await postSubgraph<{ auditLogs: unknown[] }>(
          ctx.config.subgraphUrl,
          "GetSubgraphAuditLogs",
          { trialIds: trialIds.map((id) => id), first }
        );
        subgraphLogs = sg.auditLogs ?? [];
      }

      const chainLogs = await fetchAuditLogsFromChain(ctx.provider, trialIdSet);
      return jsonText({
        trialIds,
        subgraph: subgraphLogs,
        chain: chainLogs.slice(0, first),
      });
    }
  );

  server.tool(
    "medvault_get_sponsor_verification",
    "Check SponsorRegistry verification and admin status for an address.",
    {
      sponsor: z.string(),
    },
    async ({ sponsor }) =>
      jsonText(
        await getSponsorVerification(
          ctx.provider,
          sponsor,
          ctx.config.sponsorOpenAccess
        )
      )
  );

  server.tool(
    "medvault_get_trial_pool_status",
    "Incentive pool funding and reclaim status for a trial.",
    {
      trialId: z.string(),
      trialEndTimeSec: z.union([z.string(), z.number()]).optional(),
    },
    async ({ trialId, trialEndTimeSec }) => {
      const signer = ctx.getSigner().catch(() => null);
      const reader = signer ?? ctx.provider;
      return jsonText(await getTrialPoolReclaimStatus(reader, trialId, trialEndTimeSec));
    }
  );

  server.tool(
    "medvault_read_contract_view",
    "Call a read-only contract function (dev escape hatch).",
    {
      contract: z.string(),
      functionName: z.string(),
      args: z.array(z.union([z.string(), z.number(), z.boolean()])).optional().default([]),
    },
    async ({ contract, functionName, args }) => {
      const c = getContract(contract as ContractName, ctx.provider, ctx.config.networkKey);
      const fn = (c as ethers.Contract)[functionName];
      if (typeof fn !== "function") {
        throw new Error(`Function ${functionName} not found on ${contract}`);
      }
      const result = await fn(...args);
      return jsonText({ result: serializeContractResult(result) });
    }
  );

  server.tool(
    "medvault_relayer_health",
    "GET /health from MEDVAULT_RELAYER_URL if configured.",
    {},
    async () => {
      const url = ctx.config.relayerUrl;
      if (!url) {
        throw new Error("MEDVAULT_RELAYER_URL is not set");
      }
      const base = url.replace(/\/$/, "");
      const res = await fetch(`${base}/health`);
      const body = await res.text();
      return jsonText({ status: res.status, body: tryParseJson(body) });
    }
  );

  // --- Sponsor writes ---

  server.tool(
    "medvault_create_trial",
    "Create a trial on TrialManager; optional milestones and initial pool funding.",
    {
      name: z.string(),
      phase: z.string().default("Phase 1"),
      location: z.string(),
      compensation: z.string(),
      minAge: z.number().int(),
      maxAge: z.number().int(),
      requiresDiabetes: z.boolean(),
      minHb: z.number().int(),
      genderRequirement: z.number().int().min(0).max(2),
      minHeight: z.number().int(),
      maxWeight: z.number().int(),
      requiresNonSmoker: z.boolean(),
      requiresNormalBP: z.boolean(),
      durationSeconds: z.number().int().positive(),
      milestones: z
        .array(
          z.object({
            name: z.string(),
            weight: z.number().int().describe("Basis points; total should be 10000"),
            deadlineOffsetSec: z.number().int().positive(),
          })
        )
        .optional(),
      fundingAmountEth: z.string().optional(),
    },
    async (params) => {
      await ctx.assertWritesAllowed();
      if (params.fundingAmountEth) ctx.assertFundAmount(params.fundingAmountEth);
      const signer = ctx.getSigner();
      try {
        const result = await createTrialOnChain(signer, {
          name: params.name,
          phase: params.phase,
          location: params.location,
          compensation: params.compensation,
          minAge: params.minAge,
          maxAge: params.maxAge,
          requiresDiabetes: params.requiresDiabetes,
          minHb: params.minHb,
          genderRequirement: params.genderRequirement,
          minHeight: params.minHeight,
          maxWeight: params.maxWeight,
          requiresNonSmoker: params.requiresNonSmoker,
          requiresNormalBP: params.requiresNormalBP,
          durationSeconds: params.durationSeconds,
          milestones: params.milestones,
          fundingAmountEth: params.fundingAmountEth,
        });
        return jsonText({ ok: true, ...result });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  server.tool(
    "medvault_set_trial_milestones",
    "Set phased payout milestones for an existing trial.",
    {
      trialId: z.string(),
      durationSeconds: z.number().int().positive(),
      milestones: z.array(
        z.object({
          name: z.string(),
          weight: z.number().int(),
          deadlineOffsetSec: z.number().int().positive(),
        })
      ),
    },
    async ({ trialId, durationSeconds, milestones }) => {
      await ctx.assertWritesAllowed();
      const deadlines = computeMilestoneDeadlines(milestones, durationSeconds);
      const mapped = milestones.map((m, i) => ({
        name: m.name,
        weight: m.weight,
        deadline: deadlines[i],
      }));
      const signer = ctx.getSigner();
      try {
        await setTrialMilestones(signer, trialId, mapped);
        return jsonText({ ok: true, trialId, deadlines });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  server.tool(
    "medvault_fund_trial_pool",
    "Fund a trial incentive pool with ETH.",
    {
      trialId: z.string(),
      amountEth: z.string(),
    },
    async ({ trialId, amountEth }) => {
      await ctx.assertWritesAllowed();
      ctx.assertFundAmount(amountEth);
      const signer = ctx.getSigner();
      try {
        const totalFunded = await fundTrialPool(signer, trialId, amountEth);
        return jsonText({ ok: true, trialId, totalFunded });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  server.tool(
    "medvault_update_application_status",
    "Update patient application status on EligibilityEngine (status 2 registers participant in vault).",
    {
      trialId: z.string(),
      patientAddress: z.string(),
      newStatus: z.number().int(),
      decisionMessage: z.string().optional().default("Updated via MCP"),
    },
    async ({ trialId, patientAddress, newStatus, decisionMessage }) => {
      await ctx.assertWritesAllowed();
      const signer = ctx.getSigner();
      try {
        await updateTrialApplicationStatus(
          signer,
          trialId,
          patientAddress,
          newStatus,
          decisionMessage
        );
        return jsonText({ ok: true, trialId, patientAddress, newStatus });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  server.tool(
    "medvault_deactivate_trial",
    "Deactivate (halt) a trial via TrialManager.deactivateTrial.",
    { trialId: z.string() },
    async ({ trialId }) => {
      await ctx.assertWritesAllowed();
      const signer = ctx.getSigner();
      try {
        await deactivateTrial(signer, trialId);
        return jsonText({ ok: true, trialId });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  server.tool(
    "medvault_distribute_milestone",
    "Distribute a milestone payout tranche for a trial.",
    {
      trialId: z.string(),
      milestoneIndex: z.number().int().min(0),
    },
    async ({ trialId, milestoneIndex }) => {
      await ctx.assertWritesAllowed();
      const signer = ctx.getSigner();
      try {
        await distributePartialMilestone(signer, trialId, milestoneIndex);
        return jsonText({ ok: true, trialId, milestoneIndex });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  server.tool(
    "medvault_register_anonymous_participant",
    "Register anonymous participant in incentive vault by nullifier.",
    {
      trialId: z.string(),
      nullifier: z.string(),
    },
    async ({ trialId, nullifier }) => {
      await ctx.assertWritesAllowed();
      const signer = ctx.getSigner();
      try {
        await registerAnonymousParticipantByNullifier(signer, trialId, BigInt(nullifier));
        return jsonText({ ok: true, trialId, nullifier });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  server.tool(
    "medvault_reclaim_trial_pool",
    "Reclaim undistributed incentive pool funds when rules allow.",
    { trialId: z.string() },
    async ({ trialId }) => {
      await ctx.assertWritesAllowed();
      const signer = ctx.getSigner();
      try {
        await reclaimUndistributedPool(signer, trialId);
        return jsonText({ ok: true, trialId });
      } catch (err) {
        return jsonText({ ok: false, error: normalizeTxError(err) });
      }
    }
  );

  return server;
}

function serializeContractResult(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(serializeContractResult);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializeContractResult(v);
    }
    return out;
  }
  return value;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
