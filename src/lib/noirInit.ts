/**
 * One-time WASM init for Noir 1.x in the browser (required before Noir.execute).
 * @see https://noir-lang.org/docs/tutorials/noirjs_app
 */

let initPromise: Promise<void> | null = null;

export async function ensureNoirWasmInitialized(): Promise<void> {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        const { default: initACVM } = await import("@noir-lang/acvm_js");
        const { default: initNoirC } = await import("@noir-lang/noirc_abi");
        const acvmWasm = (await import("@noir-lang/acvm_js/web/acvm_js_bg.wasm?url")).default;
        const noircWasm = (await import("@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url")).default;

        await Promise.all([
            initACVM(fetch(acvmWasm)),
            initNoirC(fetch(noircWasm)),
        ]);
    })();

    return initPromise;
}
