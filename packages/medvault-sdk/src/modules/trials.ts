import { postSubgraph } from "@medvault/core";
import type { SdkRuntimeContext } from "../context.js";
import { requireSubgraphUrl } from "../context.js";

export function createTrialsModule(ctx: SdkRuntimeContext) {
  const subgraphUrl = () => requireSubgraphUrl(ctx.config);

  return {
    async listActive(options?: { first?: number; skip?: number }) {
      const first = options?.first ?? 50;
      const skip = options?.skip ?? 0;
      return postSubgraph(subgraphUrl(), "GetActiveTrials", { first, skip });
    },

    async getBySponsor(sponsor: string) {
      return postSubgraph(subgraphUrl(), "GetTrialsBySponsor", {
        sponsor: sponsor.toLowerCase(),
      });
    },
  };
}

export type TrialsModule = ReturnType<typeof createTrialsModule>;
