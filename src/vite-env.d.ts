/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PRIVY_APP_ID?: string;
    readonly VITE_RPC_URL?: string;
    readonly VITE_SUBGRAPH_URL?: string;
    readonly VITE_TESTNET_FAUCET_URL?: string;
    /** Public faucet web page (opens in new tab). Not a JSON API. */
    readonly VITE_TESTNET_FAUCET_PAGE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
