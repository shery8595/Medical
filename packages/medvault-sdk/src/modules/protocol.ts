import { PROTOCOL_CONTRACTS, checkWiring, getContractAddresses } from "@medvault/core";
import type { SdkRuntimeContext } from "../context.js";

export function createProtocolModule(ctx: SdkRuntimeContext) {
  return {
    getAddresses() {
      return getContractAddresses(ctx.config.networkKey);
    },

    listContracts() {
      return PROTOCOL_CONTRACTS;
    },

    async checkWiring() {
      return checkWiring(ctx.provider, ctx.config.networkKey);
    },
  };
}

export type ProtocolModule = ReturnType<typeof createProtocolModule>;
