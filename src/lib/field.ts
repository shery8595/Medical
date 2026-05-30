/** Parse a BN254 field element from decimal, `0x` hex, or padded bytes32 hex (no prefix). */
export function parseFieldElement(value: string): bigint {
    const trimmed = value.trim();
    if (trimmed.startsWith("0x")) return BigInt(trimmed);
    if (/^\d+$/.test(trimmed)) return BigInt(trimmed);
    if (/^[0-9a-fA-F]{1,64}$/.test(trimmed)) return BigInt(`0x${trimmed}`);
    throw new Error(`Cannot parse field value: ${trimmed.slice(0, 24)}…`);
}

/** Parse a bytes32 hex string (with or without `0x`) to a field element. */
export function fieldFromBytes32(pi: string): bigint {
    return parseFieldElement(pi);
}

/** Parse trial IDs / on-chain uint256 strings (decimal or bytes32 hex). */
export function parseTrialId(value: string | number | bigint): bigint {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(value);
    return parseFieldElement(value);
}

/**
 * Format for @noir-lang/backend_barretenberg verifyProof (hexToUint8Array uses BigInt(hex)).
 * Accepts decimal or 0x; never pass stripped bytes32 hex without a prefix.
 */
export function publicInputsForBarretenbergVerify(publicInputs: string[]): string[] {
    return publicInputs.map((pi) => {
        const n = parseFieldElement(pi);
        return `0x${n.toString(16).padStart(64, "0")}`;
    });
}
