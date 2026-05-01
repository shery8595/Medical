import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        include: ['buffer', 'crypto', 'stream', 'util', 'process', 'events'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
      wasm(),
      topLevelAwait(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'tfhe/tfhe_bg.wasm': path.resolve(__dirname, 'public/tfhe_bg.wasm'),
        'tkms/kms_lib_bg.wasm': path.resolve(__dirname, 'public/kms_lib_bg.wasm'),
        'fetch-retry': path.resolve(__dirname, 'node_modules/fetch-retry/index.js'),
        // ⚠️ Critical browser compat fixes:
        // readable-stream v4 (top-level) has a different file structure (lib/ours/) but keccak
        // expects the v3 structure (lib/_stream_*.js). Alias to stream-browserify's own v3 copy.
        'readable-stream': path.resolve(__dirname, 'node_modules/stream-browserify/node_modules/readable-stream'),
        'keccak': path.resolve(__dirname, 'node_modules/keccak/js.js'),
        'crypto': path.resolve(__dirname, 'node_modules/crypto-browserify'),
      },
    },
    optimizeDeps: {
      include: ['keccak', 'buffer', 'fetch-retry', 'stream-browserify', 'crypto-browserify'], // Update to include stream-browserify and crypto-browserify
      exclude: ['@fhenix-fhe/relayer-sdk', 'tfhe', 'tkms'],
      esbuildOptions: {
        target: 'esnext',
      },
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      reportCompressedSize: false,
      rollupOptions: {
        maxParallelFileOps: 2,
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@privy-io')) return 'vendor-privy';
            if (id.includes('@walletconnect')) return 'vendor-walletconnect';
            if (id.includes('@react-three') || id.includes('node_modules/three/')) return 'vendor-three';
            if (id.includes('viem') || id.includes('/ox/')) return 'vendor-viem';
            if (id.includes('@cofhe') || id.includes('fhevmjs') || id.includes('/tfhe/')) return 'vendor-fhe';
            if (id.includes('@noir-lang')) return 'vendor-noir';
            if (id.includes('@semaphore-protocol')) return 'vendor-semaphore';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('recharts')) return 'vendor-recharts';
            return 'vendor';
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // Do NOT set COOP/COEP to crossOriginIsolate here. That breaks Privy embedded wallets,
      // Coinbase Smart Wallet, and Base Account SDKs (popups / cross-window messaging).
      // CoFHE runs with useWorkers: false, so SAB / strict isolation is not required for dev.
      proxy: {
        // Proxy CoFHE VRF requests through Node to bypass CORS / ERR_CONNECTION_TIMED_OUT
        '/cofhe-vrf': {
          target: 'https://testnet-cofhe-vrf.fhenix.zone',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cofhe-vrf/, ''),
          secure: true,
        },
        // Proxy relayer requests to bypass CORS in local dev
        '/relay': {
          target: 'https://medvault-relayer-production.up.railway.app',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    worker: {
      format: 'es',
    },
    assetsInclude: ['**/*.wasm'],
  };
});
