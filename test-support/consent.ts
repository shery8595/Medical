import type { Contract } from "ethers";
import type { InEInput } from "./fhe";

/** Disambiguate ConsentManager overloads for ethers v6. */
export function grantConsentLegacy(consentManager: Contract, trialId: bigint) {
    return consentManager.getFunction("grantConsent(uint256,uint256)")(trialId, 0n);
}

export function grantConsentEncrypted(
    consentManager: Contract,
    trialId: bigint,
    encrypted: InEInput
) {
    return consentManager.getFunction("grantConsent(uint256,(uint256,uint8,uint8,bytes))")(
        trialId,
        encrypted
    );
}
